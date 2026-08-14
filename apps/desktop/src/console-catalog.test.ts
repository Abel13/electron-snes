import { describe, expect, it } from 'vitest';
import { buildConsoleCatalog } from './console-catalog.js';

describe('buildConsoleCatalog', () => {
  it('combines real plugin availability with future product entries', () => {
    const catalog = buildConsoleCatalog(
      ['org.pixelcore.game-boy-family'],
      (key) => key,
      (key) => `/${key}.webp`,
    );
    expect(catalog.map(({ availability, id }) => ({ availability, id }))).toEqual([
      { availability: 'coming-soon', id: 'org.pixelcore.game-boy-advance' },
      { availability: 'available', id: 'org.pixelcore.game-boy-family' },
      { availability: 'coming-soon', id: 'org.pixelcore.product.nes' },
      { availability: 'coming-soon', id: 'org.pixelcore.product.snes' },
      { availability: 'coming-soon', id: 'org.pixelcore.product.n64' },
    ]);
    expect(catalog[1]?.extensions).toEqual(['.gb', '.gbc']);
  });
});
