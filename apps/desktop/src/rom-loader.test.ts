import { describe, expect, it } from 'vitest';

import { MAX_ROM_BYTES, loadSelectedRom } from './rom-loader.js';
import { createRomSelectionStore } from './rom-selection.js';

describe('ROM loader', () => {
  it('loads a selected ROM without exposing its path', async () => {
    const selections = createRomSelectionStore();
    const selection = selections.register('/library/game.gbc');
    const result = await loadSelectedRom(
      selection?.id ?? '',
      selections,
      async () => new Uint8Array([1, 2]),
    );
    expect(result).toMatchObject({
      rom: { extension: '.gbc', name: 'game.gbc', selectionId: selection?.id },
      status: 'loaded',
    });
  });

  it('loads a selected GBA ROM', async () => {
    const selections = createRomSelectionStore();
    const selection = selections.register('/library/game.gba');
    const result = await loadSelectedRom(
      selection?.id ?? '',
      selections,
      async () => new Uint8Array([1, 2]),
    );
    expect(result).toMatchObject({
      status: 'loaded',
      rom: { extension: '.gba', name: 'game.gba' },
    });
  });

  it('returns safe outcomes for absent, empty, oversized, and unreadable files', async () => {
    const selections = createRomSelectionStore();
    const selection = selections.register('/library/game.gb');
    await expect(
      loadSelectedRom('missing', selections, async () => new Uint8Array([1])),
    ).resolves.toMatchObject({ code: 'unavailable', status: 'error' });
    await expect(
      loadSelectedRom(selection?.id ?? '', selections, async () => new Uint8Array()),
    ).resolves.toMatchObject({ code: 'invalid-rom', status: 'error' });
    await expect(
      loadSelectedRom(
        selection?.id ?? '',
        selections,
        async () => new Uint8Array(MAX_ROM_BYTES + 1),
      ),
    ).resolves.toMatchObject({ code: 'invalid-rom', status: 'error' });
    await expect(
      loadSelectedRom(selection?.id ?? '', selections, async () =>
        Promise.reject(new Error('missing')),
      ),
    ).resolves.toMatchObject({ code: 'unavailable', status: 'error' });
  });
});
