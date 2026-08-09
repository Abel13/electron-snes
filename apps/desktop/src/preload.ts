import { contextBridge, ipcRenderer } from 'electron';

import { createPixelCoreApi } from './ipc.js';

contextBridge.exposeInMainWorld(
  'pixelCore',
  Object.freeze(createPixelCoreApi((channel) => ipcRenderer.invoke(channel))),
);
