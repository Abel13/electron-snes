export type ConsoleAvailability = 'available' | 'coming-soon';

export interface ConsoleCatalogItem {
  readonly accentColor: string;
  readonly artworkUrl: string;
  readonly availability: ConsoleAvailability;
  readonly extensions: readonly string[];
  readonly generation: string;
  readonly id: string;
  readonly name: string;
}
