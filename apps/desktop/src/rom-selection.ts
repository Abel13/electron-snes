import { randomUUID } from 'node:crypto';
import { basename, extname } from 'node:path';

import type { SelectedRom } from './ipc.js';

const supportedExtensions = new Set<SelectedRom['extension']>(['.gb', '.gbc']);

export interface RomSelectionStore {
  register(filePath: string): SelectedRom | undefined;
  resolve(id: string): string | undefined;
}

export const createRomSelectionStore = (): RomSelectionStore => {
  const pathsById = new Map<string, string>();

  return {
    register(filePath: string): SelectedRom | undefined {
      const extension = extname(filePath).toLowerCase();
      if (!supportedExtensions.has(extension as SelectedRom['extension'])) {
        return undefined;
      }

      const id = randomUUID();
      pathsById.set(id, filePath);
      return { extension: extension as SelectedRom['extension'], id, name: basename(filePath) };
    },
    resolve(id: string): string | undefined {
      return pathsById.get(id);
    },
  };
};
