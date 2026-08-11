import { expect, test } from 'vitest';

import { defineGameMetadata, validateGameMetadataPlugin } from './game-metadata.js';

const metadata = defineGameMetadata({
  manifest: {
    apiVersion: 1,
    capabilities: ['localized-game-metadata'],
    id: 'org.example.public-domain-catalog',
    name: 'Public Domain Catalog',
    permissions: [],
    type: 'game-metadata',
    version: '1.0.0',
  },
  metadata: {
    defaultLocale: 'en-US',
    id: 'org.example.public-domain-catalog',
    records: [
      {
        artwork: [{ kind: 'cover', path: 'assets/covers/orbit-demo.svg' }],
        consoleId: 'org.example.portable-console',
        developers: ['PixelCore Studio'],
        genres: ['Puzzle'],
        id: 'orbit-demo',
        identifiers: [{ namespace: 'game-boy-header-title', value: 'PIXELCORE DEMO' }],
        playerCount: { maximum: 1, minimum: 1 },
        provenance: { license: 'CC0-1.0', source: 'Example author' },
        text: {
          'en-US': { description: 'An original example game.', title: 'Orbit Demo' },
          'pt-BR': { title: 'Demo Orbital' },
        },
        releaseDate: '2026-08-11',
      },
    ],
  },
});

test('resolves identifiers with locale fallback and provenance', async () => {
  const { resolveGameMetadata } = await import('./game-metadata.js');
  expect(
    resolveGameMetadata(
      [metadata, { invalid: true }],
      [{ namespace: 'game-boy-header-title', value: 'PIXELCORE DEMO' }],
      'zh-CN',
    ),
  ).toMatchObject({
    pluginId: 'org.example.public-domain-catalog',
    title: 'Orbit Demo',
    provenance: { license: 'CC0-1.0' },
  });
});

test('accepts localized declarative metadata', () => {
  expect(validateGameMetadataPlugin(metadata)).toEqual({ definition: metadata, status: 'valid' });
});

test('requires the default locale in every record', () => {
  const result = validateGameMetadataPlugin({
    ...metadata,
    metadata: {
      ...metadata.metadata,
      records: [{ ...metadata.metadata.records[0], text: { 'pt-BR': { title: 'Demo' } } }],
    },
  });

  expect(result.status).toBe('invalid');
  if (result.status === 'invalid')
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({ path: ['metadata', 'records', 0, 'text', 'en-US'] }),
    );
});

test('rejects unsafe artwork references', () => {
  const result = validateGameMetadataPlugin({
    ...metadata,
    metadata: {
      ...metadata.metadata,
      records: [
        { ...metadata.metadata.records[0], artwork: [{ kind: 'cover', path: '../cover.png' }] },
      ],
    },
  });

  expect(result.status).toBe('invalid');
  if (result.status === 'invalid')
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({ path: ['metadata', 'records', 0, 'artwork'] }),
    );
});

test('rejects duplicated metadata record IDs', () => {
  const record = metadata.metadata.records[0];
  const result = validateGameMetadataPlugin({
    ...metadata,
    metadata: { ...metadata.metadata, records: [record, record] },
  });

  expect(result.status).toBe('invalid');
  if (result.status === 'invalid')
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({ path: ['metadata', 'records'] }),
    );
});
