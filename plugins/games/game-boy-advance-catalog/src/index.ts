import { defineGameMetadata } from '@platform/game-sdk';

export const gameBoyAdvanceExampleCatalog = defineGameMetadata({
  manifest: {
    apiVersion: 1,
    capabilities: ['localized-game-metadata'],
    id: 'org.pixelcore.example.game-boy-advance-catalog',
    name: 'Game Boy Advance Example Catalog',
    permissions: [],
    type: 'game-metadata',
    version: '1.0.0',
  },
  metadata: {
    defaultLocale: 'en-US',
    id: 'org.pixelcore.example.game-boy-advance-catalog',
    records: [
      {
        artwork: [{ kind: 'cover', path: 'assets/covers/orbit-advance-demo.svg' }],
        consoleId: 'org.pixelcore.game-boy-advance',
        developers: ['PixelCore Community'],
        genres: ['Adventure'],
        id: 'orbit-advance-demo',
        identifiers: [
          { namespace: 'gba-game-code', value: 'PCGB' },
          { namespace: 'gba-header-title', value: 'PIXELCORE ADVANCE' },
        ],
        playerCount: { maximum: 1, minimum: 1 },
        provenance: {
          attribution: 'Original PixelCore homebrew fixture metadata and artwork.',
          license: 'CC0-1.0',
          source: 'PixelCore example catalog',
        },
        text: {
          'en-US': {
            description: 'A legal, original homebrew fixture for validating GBA metadata.',
            title: 'Orbit Advance Demo',
          },
          'pt-BR': {
            description: 'Um fixture homebrew original e legal para validar metadados GBA.',
            title: 'Demo Orbit Advance',
          },
        },
      },
    ],
  },
});
