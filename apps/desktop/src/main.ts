import electron from 'electron';
import type { BrowserWindow as ElectronBrowserWindow, OpenDialogOptions } from 'electron';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createSecureWindowOptions } from './electron-security.js';
import { resolveOfficialEmulatorPlugin } from '@platform/official-plugins';
import {
  IPC_CHANNELS,
  SESSION_EVENT_CHANNELS,
  createHostVersionResponse,
  hasNoIpcPayload,
  hasRomSelectionIdPayload,
} from './ipc.js';
import { loadSelectedRom } from './rom-loader.js';
import { createRomSelectionStore } from './rom-selection.js';
import { createDesktopSessionHost } from './session-host.js';

const { app, BrowserWindow, dialog, ipcMain } = electron;

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const romSelections = createRomSelectionStore();
const officialEmulator = resolveOfficialEmulatorPlugin('org.pixelcore.sameboy');

if (officialEmulator === undefined) {
  throw new Error('The official SameBoy emulator plugin is unavailable.');
}

const createMainWindow = (): ElectronBrowserWindow => {
  const window = new BrowserWindow(createSecureWindowOptions(join(currentDirectory, 'preload.cjs')));

  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', (event) => event.preventDefault());
  window.once('ready-to-show', () => window.show());
  void window.loadFile(join(currentDirectory, 'renderer', 'renderer', 'index.html'));

  return window;
};

app.enableSandbox();

app.whenReady().then(() => {
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
