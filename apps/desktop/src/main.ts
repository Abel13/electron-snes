import { app, BrowserWindow } from 'electron';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createSecureWindowOptions } from './electron-security.js';

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
