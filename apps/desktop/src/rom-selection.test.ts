import { describe, expect, it } from 'vitest';

import { createRomSelectionStore } from './rom-selection.js';

describe('ROM selection store', () => {
  it('creates an opaque selection for supported Game Boy ROMs', () => {
    const store = createRomSelectionStore();
    const selection = store.register('/library/Pokemon Yellow.gbc');

    expect(selection).toMatchObject({ extension: '.gbc', name: 'Pokemon Yellow.gbc' });
    expect(selection?.id).not.toContain('/');
    expect(store.resolve(selection?.id ?? '')).toBe('/library/Pokemon Yellow.gbc');
  });

  it('rejects unsupported ROM extensions without retaining a path', () => {
    const store = createRomSelectionStore();

    expect(store.register('/library/game.zip')).toBeUndefined();
    expect(store.resolve('missing')).toBeUndefined();
  });
});
