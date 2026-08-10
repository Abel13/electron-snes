import electron from 'electron';

import { createPixelCoreApi } from './ipc.js';

const { contextBridge, ipcRenderer } = electron;

contextBridge.exposeInMainWorld(
  'pixelCore',
  Object.freeze(
    createPixelCoreApi(
      (channel, ...payload) => ipcRenderer.invoke(channel, ...payload),
      (channel, listener) => {
        const handler = (_event: Electron.IpcRendererEvent, payload: unknown): void =>
          listener(payload);
        ipcRenderer.on(channel, handler);
        return () => ipcRenderer.removeListener(channel, handler);
      },
    ),
  ),
);
