import type { BrowserWindowConstructorOptions } from 'electron';

export const createSecureWindowOptions = (
  preloadPath: string,
): BrowserWindowConstructorOptions => ({
  fullscreen: true,
  show: false,
  webPreferences: {
    allowRunningInsecureContent: false,
    contextIsolation: true,
    nodeIntegration: false,
    preload: preloadPath,
    sandbox: true,
    webSecurity: true,
  },
});
