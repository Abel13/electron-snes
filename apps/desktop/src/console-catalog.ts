import type { ConsoleCatalogItem } from '@platform/ui-contracts';
import type { ControlDiagramConsoleSlot } from '@platform/shared';

export const buildConsoleCatalog = (
  plugins: readonly {
    readonly accentColor: string;
    readonly assets: {
      readonly consoleHeroUrl: string;
      readonly cartridgeUrl?: string;
      readonly blueprintUrl?: string;
      readonly sessionBackdropUrl?: string;
      readonly cartridgeLabelMap?: {
        readonly aspectRatio: number;
        readonly topLeft: { readonly x: number; readonly y: number; readonly radius: number };
        readonly topRight: { readonly x: number; readonly y: number; readonly radius: number };
        readonly bottomRight: { readonly x: number; readonly y: number; readonly radius: number };
        readonly bottomLeft: { readonly x: number; readonly y: number; readonly radius: number };
      };
      readonly controlDiagram?: {
        readonly alt: string;
        readonly aspectRatio?: number;
        readonly scale?: number;
        readonly controlPoints: readonly {
          readonly action: string;
          readonly slot: ControlDiagramConsoleSlot;
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
