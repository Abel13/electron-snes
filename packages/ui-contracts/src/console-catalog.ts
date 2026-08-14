export type ConsoleAvailability = 'available' | 'coming-soon';

export interface ConsoleCatalogItem {
  readonly accentColor: string;
  readonly artworkUrl: string;
  readonly assets?: {
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
      readonly controlPoints: readonly {
        readonly action: string;
        readonly x: number;
        readonly y: number;
      }[];
    };
  };
  readonly availability: ConsoleAvailability;
  readonly extensions: readonly string[];
  readonly generation: string;
  readonly id: string;
  readonly name: string;
}
