import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import type { OpenDialogOptions } from 'electron';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createSecureWindowOptions } from './electron-security.js';
import { IPC_CHANNELS, createHostVersionResponse, hasNoIpcPayload } from './ipc.js';
import { createRomSelectionStore } from './rom-selection.js';

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const romSelections = createRomSelectionStore();

const createMainWindow = (): BrowserWindow => {
  const window = new BrowserWindow(createSecureWindowOptions(join(currentDirectory, 'preload.js')));

  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', (event) => event.preventDefault());
  window.once('ready-to-show', () => window.show());
  void window.loadURL('about:blank');

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

  createMainWindow();

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
