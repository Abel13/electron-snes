import electron from 'electron';
import type { BrowserWindow as ElectronBrowserWindow, OpenDialogOptions } from 'electron';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createSecureWindowOptions } from './electron-security.js';
import { InputProfileRepository } from '@platform/input';
import {
  resolveOfficialConsolePlugin,
  resolveOfficialEmulatorPlugin,
} from '@platform/official-plugins';
import {
  IPC_CHANNELS,
  SESSION_EVENT_CHANNELS,
  createHostVersionResponse,
  hasNoIpcPayload,
  hasInputProfilePayload,
  hasRomSelectionIdPayload,
  hasSessionInputPayload,
} from './ipc.js';
import { JsonFileStorage } from './json-file-storage.js';
import { loadSelectedRom } from './rom-loader.js';
import { createRomSelectionStore } from './rom-selection.js';
import { createDesktopSessionHost } from './session-host.js';

const { app, BrowserWindow, dialog, ipcMain } = electron;

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const romSelections = createRomSelectionStore();
const officialEmulator = resolveOfficialEmulatorPlugin('org.pixelcore.sameboy');
const officialConsole = resolveOfficialConsolePlugin('org.pixelcore.game-boy-family');

if (officialEmulator === undefined || officialConsole === undefined)
  throw new Error('The official Game Boy runtime plugins are unavailable.');

const createMainWindow = (): ElectronBrowserWindow => {
  const window = new BrowserWindow(
    createSecureWindowOptions(join(currentDirectory, 'preload.cjs')),
  );

  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', (event) => event.preventDefault());
  window.once('ready-to-show', () => window.show());
  void window.loadFile(join(currentDirectory, 'renderer', 'renderer', 'index.html'));

  return window;
};

app.enableSandbox();

app.whenReady().then(() => {
  const inputProfiles = new InputProfileRepository(
    new JsonFileStorage(join(app.getPath('userData'), 'preferences.json')),
  );
  ipcMain.handle(IPC_CHANNELS.getHostVersion, (_event, ...payload: unknown[]) => {
    if (!hasNoIpcPayload(payload)) {
      throw new Error('The host-version IPC channel does not accept a payload.');
    }

    return createHostVersionResponse(app.getVersion());
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

  ipcMain.handle(IPC_CHANNELS.saveInputProfile, async (_event, ...payload: unknown[]) => {
    if (!hasInputProfilePayload(payload))
      throw new Error('The save-input-profile channel requires one valid profile.');
    const saved = await inputProfiles.save(payload[0]);
    return saved.ok
      ? { profile: payload[0], status: 'saved' }
      : { message: saved.error.message, status: 'error' };
  });

  const sessionHost = createDesktopSessionHost(officialEmulator, {
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

  ipcMain.handle(IPC_CHANNELS.startSession, async (_event, ...payload: unknown[]) => {
    if (!hasRomSelectionIdPayload(payload))
      throw new Error('The start-session IPC channel requires one opaque selection ID.');
    const loaded = await loadSelectedRom(payload[0], romSelections, readFile);
    return loaded.status === 'loaded'
      ? sessionHost.launch(loaded.rom)
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

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
