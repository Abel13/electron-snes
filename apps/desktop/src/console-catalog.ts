import type { ConsoleCatalogItem } from '@platform/ui-contracts';

export const buildConsoleCatalog = (
  plugins: readonly {
    readonly accentColor: string;
    readonly assets: {
      readonly consoleHeroUrl: string;
      readonly cartridgeUrl?: string;
      readonly blueprintUrl?: string;
      readonly sessionBackdropUrl?: string;
      readonly controlDiagram?: {
        readonly alt: string;
        readonly controlPoints: readonly {
          readonly action: string;
          readonly x: number;
          readonly y: number;
        }[];
      };
    };
    readonly extensions: readonly string[];
    readonly generationKey: string;
    readonly id: string;
    readonly name: string;
  }[],
  localize: (key: string) => string,
): readonly ConsoleCatalogItem[] => {
  return plugins.map((plugin) => ({
    accentColor: plugin.accentColor,
    assets: plugin.assets,
    artworkUrl: plugin.assets.consoleHeroUrl,
    availability: 'available' as const,
    extensions: plugin.extensions,
    generation: localize(plugin.generationKey),
    id: plugin.id,
    name: plugin.name,
  }));
};
