import { describe, expect, it } from 'vitest';
import type { JsonStoragePort } from '@platform/core';
import type { JsonValue } from '@platform/shared';

import { LocalGameLibrary } from './local-game-library.js';

const createStorage = (): JsonStoragePort => {
  let document: JsonValue | undefined;
  return {
    list: async () => ({ ok: true, value: {} }),
    read: async () => ({ ok: true, value: document }),
    remove: async () => ({ ok: true, value: undefined }),
    write: async (_domain, _key, value) => {
      document = value;
      return { ok: true, value: undefined };
    },
  };
};

describe('LocalGameLibrary', () => {
  it('stores metadata and an opaque local source reference without ROM bytes', async () => {
    const library = new LocalGameLibrary(
      createStorage(),
      () => 'game-1',
      () => '2026-08-09T00:00:00.000Z',
    );

    await expect(
      library.add({ extension: '.gb', name: 'Pokemon Yellow', sourceKey: 'source-1' }),
    ).resolves.toEqual({
      ok: true,
      value: {
        addedAt: '2026-08-09T00:00:00.000Z',
        extension: '.gb',
        favorite: false,
        id: 'game-1',
        name: 'Pokemon Yellow',
        sourceKey: 'source-1',
      },
    });
    await expect(library.list()).resolves.toMatchObject({ ok: true, value: [{ id: 'game-1' }] });
  });

  it('updates favorites, artwork, and recent activity without exposing ROM bytes', async () => {
    let index = 0;
    const library = new LocalGameLibrary(
      createStorage(),
      () => 'game-1',
      () => `2026-08-09T00:00:0${index++}.000Z`,
    );
    await library.add({ extension: '.gbc', name: 'Crystal', sourceKey: 'crystal.gbc' });
    await expect(library.setFavorite('game-1', true)).resolves.toMatchObject({
      ok: true,
      value: { favorite: true },
    });
    await expect(library.setArtwork('game-1', 'game-1.png')).resolves.toMatchObject({
      ok: true,
      value: { artworkKey: 'game-1.png' },
    });
    await expect(library.markPlayed('game-1')).resolves.toMatchObject({
      ok: true,
      value: { lastPlayedAt: '2026-08-09T00:00:01.000Z' },
    });
  });

  it('rejects duplicate local source references', async () => {
    const library = new LocalGameLibrary(
      createStorage(),
      () => 'game-1',
      () => '2026-08-09T00:00:00.000Z',
    );
    await library.add({ extension: '.gbc', name: 'Pokemon Crystal', sourceKey: 'source-1' });

    await expect(
      library.add({ extension: '.gbc', name: 'Pokemon Crystal', sourceKey: 'source-1' }),
    ).resolves.toMatchObject({ error: { code: 'conflict' }, ok: false });
  });
});
