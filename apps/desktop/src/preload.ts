import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('pixelCore', Object.freeze({}));
