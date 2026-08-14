import { describe, expect, it } from 'vitest';
import { buildConsoleCatalog } from './console-catalog.js';

describe('buildConsoleCatalog', () => {
  it('builds the catalog from validated plugin entries', () => {
    const catalog = buildConsoleCatalog(
      [
        {
          accentColor: '#27e3dc',
          assets: { consoleHeroUrl: '/game-boy-family.webp' },
          extensions: ['.gb', '.gbc'],
          generationKey: 'generationHandheld',
          id: 'org.pixelcore.game-boy-family',
          name: 'Game Boy Family',
        },
      ],
      (key) => key,
    );
    expect(catalog.map(({ availability, id }) => ({ availability, id }))).toEqual([
      { availability: 'available', id: 'org.pixelcore.game-boy-family' },
    ]);
    expect(catalog[0]?.extensions).toEqual(['.gb', '.gbc']);
    expect(catalog[0]?.artworkUrl).toBe('/game-boy-family.webp');
  });
});
