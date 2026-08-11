import { readFile } from 'node:fs/promises';

import { expect, test } from 'vitest';

import { PluginManifestSchema } from './manifest.js';
import { validatePluginManifest } from './validate-manifest.js';

const fixtureDirectory = new URL('../fixtures/', import.meta.url);
const validFixtureNames = [
  'console.json',
  'emulator-core.json',
  'controller.json',
  'game-metadata.json',
  'theme.json',
  'integration.json',
] as const;

const readFixture = async (path: string): Promise<unknown> =>
  JSON.parse(await readFile(new URL(path, fixtureDirectory), 'utf8'));

for (const fixtureName of validFixtureNames) {
  test(`accepts the ${fixtureName} contract fixture`, async () => {
    const fixture = await readFixture(`valid/${fixtureName}`);
    const result = validatePluginManifest(fixture);

    expect(PluginManifestSchema.safeParse(fixture).success).toBe(true);
    expect(result.status).toBe('valid');
  });
}

test('keeps a structurally valid future API fixture inactive', async () => {
  const result = validatePluginManifest(await readFixture('inactive/unsupported-api-version.json'));

  expect(result.status).toBe('inactive');

  if (result.status === 'inactive') {
    expect(result.diagnostic).toMatchObject({
      code: 'unsupported-plugin-api-version',
      path: ['apiVersion'],
    });
  }
});

test('reports safe diagnostics for the malformed contract fixture', async () => {
  const result = validatePluginManifest(await readFixture('invalid/malformed-manifest.json'));

  expect(result.status).toBe('invalid');

  if (result.status === 'invalid') {
    expect(result.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'manifest-schema-invalid', path: ['apiVersion'] }),
        expect.objectContaining({ code: 'manifest-schema-invalid', path: ['type'] }),
      ]),
    );
  }
});
