import { basename, extname } from 'node:path';

import type { LoadRomResponse } from './ipc.js';
import type { RomSelectionStore } from './rom-selection.js';

export const MAX_ROM_BYTES = 8 * 1024 * 1024;
export type ReadRomFile = (filePath: string) => Promise<Uint8Array>;

export const loadSelectedRom = async (
  selectionId: string,
  selections: RomSelectionStore,
  readRomFile: ReadRomFile,
): Promise<LoadRomResponse> => {
  const filePath = selections.resolve(selectionId);
  if (filePath === undefined) return unavailable('Select a ROM again before loading it.');
  const extension = extname(filePath).toLowerCase();
  if (extension !== '.gb' && extension !== '.gbc')
    return invalid('The selected file is not a supported Game Boy ROM.');
  try {
    const bytes = await readRomFile(filePath);
    if (bytes.byteLength === 0 || bytes.byteLength > MAX_ROM_BYTES)
      return invalid('The selected ROM must be between 1 byte and 8 MiB.');
    return {
      rom: { bytes: new Uint8Array(bytes), extension, name: basename(filePath), selectionId },
      status: 'loaded',
    };
  } catch {
    return unavailable('The selected ROM is no longer available.');
  }
};

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
