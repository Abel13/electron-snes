import { defineGameMetadata } from '@platform/game-sdk';

export const referenceGameCatalog = defineGameMetadata({
  manifest: {
    apiVersion: 1,
    capabilities: ['localized-game-metadata'],
    id: 'org.pixelcore.example.reference-catalog',
    name: 'Reference Game Catalog',
    permissions: [],
    type: 'game-metadata',
    version: '1.0.0',
  },
  metadata: {
    defaultLocale: 'en-US',
    id: 'org.pixelcore.example.reference-catalog',
    records: [
      {
        artwork: [{ kind: 'cover', path: 'assets/covers/orbit-demo.svg' }],
        consoleId: 'org.pixelcore.example.reference-handheld',
        id: 'orbit-demo',
        provenance: {
          attribution: 'Original PixelCore example artwork and copy.',
          license: 'CC0-1.0',
          source: 'PixelCore reference catalog',
        },
        text: {
          'en-US': {
            description: 'Guide a signal through a quiet field of stars.',
            title: 'Orbit Demo',
          },
          'pt-BR': {
            description: 'Guie um sinal por um campo tranquilo de estrelas.',
            title: 'Demo Orbital',
          },
          'zh-CN': { description: '引导信号穿过宁静的星空。', title: '轨道演示' },
        },
      },
    ],
  },
});
