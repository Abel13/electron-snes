import { app, BrowserWindow, ipcMain } from 'electron';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createSecureWindowOptions } from './electron-security.js';
import { IPC_CHANNELS, createHostVersionResponse, hasNoIpcPayload } from './ipc.js';

const currentDirectory = dirname(fileURLToPath(import.meta.url));

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
