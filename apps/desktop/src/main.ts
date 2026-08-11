import electron from 'electron';
import type { BrowserWindow as ElectronBrowserWindow, OpenDialogOptions } from 'electron';
import { copyFile, mkdir, readFile, readdir, stat } from 'node:fs/promises';
import { basename, dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash, randomUUID } from 'node:crypto';

import { createSecureWindowOptions } from './electron-security.js';
import { InputProfileRepository } from '@platform/input';
import { LocalGameLibrary } from '@platform/library';
import type { LocalGame } from '@platform/library';
import {
  listOfficialConsolePluginIds,
  resolveOfficialConsolePlugin,
  resolveOfficialEmulatorPlugin,
} from '@platform/official-plugins';
import {
  IPC_CHANNELS,
  SESSION_EVENT_CHANNELS,
  createHostVersionResponse,
  hasFavoritePayload,
  hasGlobalPreferencesPayload,
  hasLibraryGameIdPayload,
  hasNoIpcPayload,
  hasInputProfilePayload,
  hasRomSelectionIdPayload,
  hasSessionInputPayload,
} from './ipc.js';
import { JsonFileStorage } from './json-file-storage.js';
import { GlobalPreferencesRepository } from './global-preferences.js';
import { loadSelectedRom } from './rom-loader.js';
import { createRomSelectionStore } from './rom-selection.js';
import { createDesktopSessionHost } from './session-host.js';
import { CartridgeSaveStore } from './cartridge-save-store.js';

const { app, BrowserWindow, dialog, ipcMain } = electron;

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const romSelections = createRomSelectionStore();
const officialEmulator = resolveOfficialEmulatorPlugin('org.pixelcore.sameboy');
const officialConsole = resolveOfficialConsolePlugin('org.pixelcore.game-boy-family');
let stopActiveSession: (() => Promise<void>) | undefined;
let quitAfterSaveFlush = false;

if (officialEmulator === undefined || officialConsole === undefined)
  throw new Error('The official Game Boy runtime plugins are unavailable.');

const createMainWindow = (): ElectronBrowserWindow => {
  const window = new BrowserWindow(
    createSecureWindowOptions(join(currentDirectory, 'preload.cjs')),
  );

  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', (event) => event.preventDefault());
  window.webContents.on('did-fail-load', (_event, code, description, url) => {
    console.error(`Renderer failed to load ${url}: ${code} ${description}`);
  });
  window.once('ready-to-show', () => window.show());
  const developmentServerUrl = process.env['PIXELCORE_DEV_SERVER_URL'];
  if (developmentServerUrl === undefined) {
    void window.loadFile(join(currentDirectory, 'renderer', 'renderer', 'index.html'));
  } else {
    window.webContents.on('console-message', (_event, level, message) => {
      console.log(`[renderer:${level}] ${message}`);
    });
    window.webContents.openDevTools({ mode: 'detach' });
    void window.loadURL(`${developmentServerUrl}/renderer/index.html`);
  }

  return window;
};

app.enableSandbox();

app.whenReady().then(() => {
  const libraryStorage = new JsonFileStorage(join(app.getPath('userData'), 'library.json'));
  const library = new LocalGameLibrary(libraryStorage, randomUUID, () => new Date().toISOString());
  const romDirectory = join(app.getPath('documents'), 'PixelCore', 'ROMs');
  const artworkDirectory = join(app.getPath('userData'), 'artwork');
  const cartridgeSaves = new CartridgeSaveStore(
    join(app.getPath('userData'), 'saves', 'cartridge'),
  );
  const preferencesStorage = new JsonFileStorage(join(app.getPath('userData'), 'preferences.json'));
  const inputProfiles = new InputProfileRepository(preferencesStorage);
  const globalPreferences = new GlobalPreferencesRepository(preferencesStorage);

  const toLibraryGame = async (game: LocalGame) => {
    let artworkDataUrl: string | undefined;
    if (game.artworkKey !== undefined && basename(game.artworkKey) === game.artworkKey) {
      try {
        const bytes = await readFile(join(artworkDirectory, game.artworkKey));
        const extension = extname(game.artworkKey).toLowerCase();
        const mime =
          extension === '.png' ? 'image/png' : extension === '.webp' ? 'image/webp' : 'image/jpeg';
        artworkDataUrl = `data:${mime};base64,${bytes.toString('base64')}`;
      } catch {
        artworkDataUrl = undefined;
      }
    }
    return {
      addedAt: game.addedAt,
      ...(artworkDataUrl === undefined ? {} : { artworkDataUrl }),
      extension: game.extension,
      favorite: game.favorite,
      id: game.id,
      ...(game.lastPlayedAt === undefined ? {} : { lastPlayedAt: game.lastPlayedAt }),
      name: game.name,
    };
  };

  const synchronizeRomDirectory = async (): Promise<void> => {
    await mkdir(romDirectory, { recursive: true });
    const games = await library.list();
    if (!games.ok) return;
    const knownSources = new Set(games.value.map((game) => game.sourceKey));
    for (const sourceKey of await readdir(romDirectory)) {
      const extension = extname(sourceKey).toLowerCase();
      if ((extension !== '.gb' && extension !== '.gbc') || knownSources.has(sourceKey)) continue;
      await library.add({
        extension,
        name: basename(sourceKey, extension),
        sourceKey,
      });
    }
  };

  ipcMain.handle(IPC_CHANNELS.listLibrary, async (_event, ...payload: unknown[]) => {
    if (!hasNoIpcPayload(payload))
      throw new Error('The library channel does not accept a payload.');
    try {
      await synchronizeRomDirectory();
      const games = await library.list();
      if (!games.ok) return { message: games.error.message, status: 'error' };
      return { games: await Promise.all(games.value.map(toLibraryGame)), status: 'ready' };
    } catch {
      return { message: 'The local game library could not be loaded.', status: 'error' };
    }
  });

  ipcMain.handle(IPC_CHANNELS.listConsolePlugins, (_event, ...payload: unknown[]) => {
    if (!hasNoIpcPayload(payload))
      throw new Error('The console plugin channel does not accept a payload.');
    return { ids: listOfficialConsolePluginIds() };
  });

  ipcMain.handle(IPC_CHANNELS.importGame, async (event, ...payload: unknown[]) => {
    if (!hasNoIpcPayload(payload)) throw new Error('The import channel does not accept a payload.');
    const ownerWindow = BrowserWindow.fromWebContents(event.sender);
    const options: OpenDialogOptions = {
      filters: [{ extensions: ['gb', 'gbc'], name: 'Game Boy ROMs' }],
      properties: ['openFile'],
      title: 'Add a game to PixelCore',
    };
    const result = ownerWindow
      ? await dialog.showOpenDialog(ownerWindow, options)
      : await dialog.showOpenDialog(options);
    const [filePath] = result.filePaths;
    if (result.canceled || filePath === undefined) return { status: 'cancelled' };
    try {
      const extension = extname(filePath).toLowerCase();
      if (extension !== '.gb' && extension !== '.gbc')
        return { message: 'Choose a supported .gb or .gbc ROM.', status: 'error' };
      const file = await stat(filePath);
      if (file.size <= 0 || file.size > 8 * 1024 * 1024)
        return { message: 'The ROM must be between 1 byte and 8 MiB.', status: 'error' };
      await mkdir(romDirectory, { recursive: true });
      const sourceKey = `${randomUUID()}-${basename(filePath)}`;
      await copyFile(filePath, join(romDirectory, sourceKey));
      const added = await library.add({
        extension,
        name: basename(filePath, extension),
        sourceKey,
      });
      return added.ok
        ? { game: await toLibraryGame(added.value), status: 'imported' }
        : { message: added.error.message, status: 'error' };
    } catch {
      return {
        message: 'The game could not be copied to the PixelCore ROM folder.',
        status: 'error',
      };
    }
  });

  ipcMain.handle(IPC_CHANNELS.updateFavorite, async (_event, ...payload: unknown[]) => {
    if (!hasFavoritePayload(payload))
      throw new Error('The favorite channel requires a game ID and boolean.');
    const updated = await library.setFavorite(payload[0], payload[1]);
    return updated.ok
      ? { game: await toLibraryGame(updated.value), status: 'updated' }
      : { message: updated.error.message, status: 'error' };
  });

  ipcMain.handle(IPC_CHANNELS.selectGameArtwork, async (event, ...payload: unknown[]) => {
    if (!hasLibraryGameIdPayload(payload))
      throw new Error('The artwork channel requires one game ID.');
    const ownerWindow = BrowserWindow.fromWebContents(event.sender);
    const options: OpenDialogOptions = {
      filters: [{ extensions: ['png', 'jpg', 'jpeg', 'webp'], name: 'Game artwork' }],
      properties: ['openFile'],
      title: 'Choose game artwork',
    };
    const result = ownerWindow
      ? await dialog.showOpenDialog(ownerWindow, options)
      : await dialog.showOpenDialog(options);
    const [filePath] = result.filePaths;
    if (result.canceled || filePath === undefined) return { status: 'cancelled' };
    try {
      const extension = extname(filePath).toLowerCase();
      if (!['.png', '.jpg', '.jpeg', '.webp'].includes(extension))
        return { message: 'Choose PNG, JPG, or WebP artwork.', status: 'error' };
      const file = await stat(filePath);
      if (file.size <= 0 || file.size > 5 * 1024 * 1024)
        return { message: 'Artwork must be smaller than 5 MiB.', status: 'error' };
      await mkdir(artworkDirectory, { recursive: true });
      const artworkKey = `${payload[0]}${extension}`;
      await copyFile(filePath, join(artworkDirectory, artworkKey));
      const updated = await library.setArtwork(payload[0], artworkKey);
      return updated.ok
        ? { game: await toLibraryGame(updated.value), status: 'updated' }
        : { message: updated.error.message, status: 'error' };
    } catch {
      return { message: 'The artwork could not be stored.', status: 'error' };
    }
  });
  ipcMain.handle(IPC_CHANNELS.getHostVersion, (_event, ...payload: unknown[]) => {
    if (!hasNoIpcPayload(payload)) {
      throw new Error('The host-version IPC channel does not accept a payload.');
    }

    return createHostVersionResponse(app.getVersion());
  });
  ipcMain.handle(IPC_CHANNELS.quitApplication, (_event, ...payload: unknown[]) => {
    if (!hasNoIpcPayload(payload)) throw new Error('The quit-application channel takes no payload.');
    setImmediate(() => app.quit());
  });

  ipcMain.handle(IPC_CHANNELS.selectRom, async (event, ...payload: unknown[]) => {
    if (!hasNoIpcPayload(payload)) {
      throw new Error('The select-ROM IPC channel does not accept a payload.');
    }

    const ownerWindow = BrowserWindow.fromWebContents(event.sender);
    const options: OpenDialogOptions = {
      filters: [{ extensions: ['gb', 'gbc'], name: 'Game Boy ROMs' }],
      properties: ['openFile'],
      title: 'Select a Game Boy ROM',
    };
    const result = ownerWindow
      ? await dialog.showOpenDialog(ownerWindow, options)
      : await dialog.showOpenDialog(options);

    const [filePath] = result.filePaths;
    if (result.canceled || result.filePaths.length !== 1 || filePath === undefined) {
      return { status: 'cancelled' };
    }

    const selection = romSelections.register(filePath);
    if (!selection) {
      throw new Error('The selected ROM has an unsupported extension.');
    }

    return { rom: selection, status: 'selected' };
  });

  ipcMain.handle(IPC_CHANNELS.loadRom, async (_event, ...payload: unknown[]) => {
    if (!hasRomSelectionIdPayload(payload))
      throw new Error('The load-ROM IPC channel requires one opaque selection ID.');
    return loadSelectedRom(payload[0], romSelections, readFile);
  });

  ipcMain.handle(IPC_CHANNELS.getInputConfiguration, async (_event, ...payload: unknown[]) => {
    if (!hasNoIpcPayload(payload))
      throw new Error('The input-configuration channel does not accept a payload.');
    const loaded = await inputProfiles.load('default');
    if (!loaded.ok) throw new Error(loaded.error.message);
    return {
      mapping: {
        consoleId: officialConsole.console.id,
        entries: officialConsole.console.inputMapping.entries,
        playerPortId: officialConsole.console.inputMapping.playerPortId,
        version: officialConsole.console.inputMapping.version,
      },
      ...(loaded.value === undefined ? {} : { profile: loaded.value }),
    };
  });

  ipcMain.handle(IPC_CHANNELS.getGlobalPreferences, async (_event, ...payload: unknown[]) => {
    if (!hasNoIpcPayload(payload))
      throw new Error('The global-preferences channel does not accept a payload.');
    const loaded = await globalPreferences.load();
    return loaded.ok
      ? { ...(loaded.value === undefined ? {} : { preferences: loaded.value }), status: 'ready' }
      : { message: loaded.error.message, status: 'error' };
  });

  ipcMain.handle(IPC_CHANNELS.saveGlobalPreferences, async (_event, ...payload: unknown[]) => {
    if (!hasGlobalPreferencesPayload(payload))
      throw new Error('The save-global-preferences channel requires valid preferences.');
    const saved = await globalPreferences.save(payload[0]);
    return saved.ok
      ? { preferences: payload[0], status: 'saved' }
      : { message: saved.error.message, status: 'error' };
  });

  ipcMain.handle(IPC_CHANNELS.saveInputProfile, async (_event, ...payload: unknown[]) => {
    if (!hasInputProfilePayload(payload))
      throw new Error('The save-input-profile channel requires one valid profile.');
    const saved = await inputProfiles.save(payload[0]);
    return saved.ok
      ? { profile: payload[0], status: 'saved' }
      : { message: saved.error.message, status: 'error' };
  });

  const sessionHost = createDesktopSessionHost(officialEmulator, {
    loadCartridgeSave: (key) => cartridgeSaves.read(key),
    persistCartridgeSave: (key, bytes) => cartridgeSaves.write(key, bytes),
    sendAudio: (frame) =>
      mainWindow?.webContents.send(SESSION_EVENT_CHANNELS.audio, {
        channels: frame.channels,
        sampleRate: frame.sampleRate,
        samples: frame.samples.buffer,
      }),
    sendVideo: (frame) =>
      mainWindow?.webContents.send(SESSION_EVENT_CHANNELS.video, {
        height: frame.height,
        pixels: frame.pixels.buffer,
        width: frame.width,
      }),
  });
  stopActiveSession = async () => {
    await sessionHost.stop();
  };

  ipcMain.handle(IPC_CHANNELS.startLibraryGame, async (_event, ...payload: unknown[]) => {
    if (!hasLibraryGameIdPayload(payload))
      throw new Error('The library session requires one game ID.');
    const game = await library.find(payload[0]);
    if (!game.ok || basename(game.value.sourceKey) !== game.value.sourceKey)
      return {
        code: 'unavailable',
        message: game.ok ? 'The game source is invalid.' : game.error.message,
        status: 'error',
      };
    const selection = romSelections.register(join(romDirectory, game.value.sourceKey));
    if (selection === undefined)
      return {
        code: 'invalid-rom',
        message: 'The library entry is not a supported ROM.',
        status: 'error',
      };
    const loaded = await loadSelectedRom(selection.id, romSelections, readFile);
    if (loaded.status !== 'loaded')
      return { code: loaded.code, message: loaded.message, status: 'error' };
    const launched = await sessionHost.launch(loaded.rom, identifyRom(loaded.rom.bytes));
    if (launched.status === 'ok') await library.markPlayed(game.value.id);
    return launched;
  });

  ipcMain.handle(IPC_CHANNELS.startSession, async (_event, ...payload: unknown[]) => {
    if (!hasRomSelectionIdPayload(payload))
      throw new Error('The start-session IPC channel requires one opaque selection ID.');
    const loaded = await loadSelectedRom(payload[0], romSelections, readFile);
    return loaded.status === 'loaded'
      ? sessionHost.launch(loaded.rom, identifyRom(loaded.rom.bytes))
      : { code: loaded.code, message: loaded.message, status: 'error' };
  });

  ipcMain.handle(IPC_CHANNELS.setSessionInput, async (_event, ...payload: unknown[]) => {
    if (!hasSessionInputPayload(payload))
      throw new Error('The session-input channel requires one valid input snapshot.');
    const port = officialConsole.console.playerPorts.find(
      (candidate) => candidate.id === payload[0].playerPortId,
    );
    if (
      port === undefined ||
      payload[0].actions.some((action) => !port.inputActions.includes(action))
    )
      throw new Error('The session input references an unavailable console action.');
    return sessionHost.setInput(payload[0].playerPortId, payload[0].actions);
  });

  for (const [channel, action] of [
    [IPC_CHANNELS.pauseSession, () => sessionHost.pause()],
    [IPC_CHANNELS.resumeSession, () => sessionHost.resume()],
    [IPC_CHANNELS.stopSession, () => sessionHost.stop()],
  ] as const) {
    ipcMain.handle(channel, async (_event, ...payload: unknown[]) => {
      if (!hasNoIpcPayload(payload)) throw new Error(`${channel} does not accept a payload.`);
      return action();
    });
  }

  const mainWindow = createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('before-quit', (event) => {
  if (quitAfterSaveFlush || stopActiveSession === undefined) return;
  event.preventDefault();
  const stop = stopActiveSession;
  stopActiveSession = undefined;
  void stop().finally(() => {
    quitAfterSaveFlush = true;
    app.quit();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

const identifyRom = (bytes: Uint8Array): string => createHash('sha256').update(bytes).digest('hex');
