import type { ConsoleCatalogItem } from '@platform/ui-contracts';

interface ProductConsoleEntry {
  readonly accentColor: string;
  readonly artworkKey: 'game-boy-family' | 'game-boy-advance' | 'n64-era' | 'nes-era' | 'snes-era';
  readonly extensions: readonly string[];
  readonly generationKey: string;
  readonly id: string;
  readonly name: string;
}

export const PRODUCT_CONSOLE_CATALOG: readonly ProductConsoleEntry[] = [
  {
    accentColor: '#6edcff',
    artworkKey: 'game-boy-advance',
    extensions: ['.gba'],
    generationKey: 'generationHandheld',
    id: 'org.pixelcore.game-boy-advance',
    name: 'Game Boy Advance',
  },
  {
    accentColor: '#27e3dc',
    artworkKey: 'game-boy-family',
    extensions: ['.gb', '.gbc'],
    generationKey: 'generationHandheld',
    id: 'org.pixelcore.game-boy-family',
    name: 'Game Boy Family',
  },
  {
    accentColor: '#ffb454',
    artworkKey: 'nes-era',
    extensions: ['.nes'],
    generationKey: 'generationEightBit',
    id: 'org.pixelcore.product.nes',
    name: 'NES',
  },
  {
    accentColor: '#dc64ff',
    artworkKey: 'snes-era',
    extensions: ['.sfc', '.smc'],
    generationKey: 'generationSixteenBit',
    id: 'org.pixelcore.product.snes',
    name: 'SNES',
  },
  {
    accentColor: '#6e8dff',
    artworkKey: 'n64-era',
    extensions: ['.z64', '.n64'],
    generationKey: 'generationThreeD',
    id: 'org.pixelcore.product.n64',
    name: 'Nintendo 64',
  },
];

export const buildConsoleCatalog = (
  availablePluginIds: readonly string[],
  localize: (key: string) => string,
  artworkFor: (key: ProductConsoleEntry['artworkKey']) => string,
): readonly ConsoleCatalogItem[] => {
  const available = new Set(availablePluginIds);
  return PRODUCT_CONSOLE_CATALOG.map((entry) => ({
    accentColor: entry.accentColor,
    artworkUrl: artworkFor(entry.artworkKey),
    availability: available.has(entry.id) ? 'available' : 'coming-soon',
    extensions: entry.extensions,
    generation: localize(entry.generationKey),
    id: entry.id,
    name: entry.name,
  }));
};
