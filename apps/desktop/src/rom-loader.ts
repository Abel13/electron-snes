import { basename, extname } from 'node:path';

import type { LoadRomResponse } from './ipc.js';
import type { RomSelectionStore } from './rom-selection.js';

export const MAX_ROM_BYTES = 8 * 1024 * 1024;
export type ReadRomFile = (filePath: string) => Promise<Uint8Array>;
export type RomSizeLimit = number | ((extension: string) => number);

export const loadSelectedRom = async (
  selectionId: string,
  selections: RomSelectionStore,
  readRomFile: ReadRomFile,
  romSizeLimit: RomSizeLimit = MAX_ROM_BYTES,
): Promise<LoadRomResponse> => {
  const filePath = selections.resolve(selectionId);
  if (filePath === undefined) return unavailable('Select a ROM again before loading it.');
  const extension = extname(filePath).toLowerCase();
  if (extension !== '.gb' && extension !== '.gbc' && extension !== '.gba')
    return invalid('The selected file is not a supported ROM.');
  try {
    const bytes = await readRomFile(filePath);
    const maximumBytes =
      typeof romSizeLimit === 'function' ? romSizeLimit(extension) : romSizeLimit;
    if (bytes.byteLength === 0 || bytes.byteLength > maximumBytes)
      return invalid(`The selected ROM must be between 1 byte and ${formatBytes(maximumBytes)}.`);
    return {
      rom: { bytes: new Uint8Array(bytes), extension, name: basename(filePath), selectionId },
      status: 'loaded',
    };
  } catch {
    return unavailable('The selected ROM is no longer available.');
  }
};

export const formatBytes = (bytes: number): string =>
  bytes % (1024 * 1024) === 0 ? `${bytes / (1024 * 1024)} MiB` : `${bytes} bytes`;

const invalid = (message: string): LoadRomResponse => ({
  code: 'invalid-rom',
  message,
  status: 'error',
});
const unavailable = (message: string): LoadRomResponse => ({
  code: 'unavailable',
  message,
  status: 'error',
});
