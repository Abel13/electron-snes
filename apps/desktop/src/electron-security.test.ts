import { expect, test } from 'vitest';

import { createSecureWindowOptions } from './electron-security.js';

test('creates window options with renderer isolation and no Node integration', () => {
  expect(createSecureWindowOptions('/safe/preload.js')).toMatchObject({
    fullscreen: true,
    show: false,
    webPreferences: {
      allowRunningInsecureContent: false,
      contextIsolation: true,
      nodeIntegration: false,
      preload: '/safe/preload.js',
      sandbox: true,
      webSecurity: true,
    },
  });
});
