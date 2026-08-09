import { expect, expectTypeOf, test } from 'vitest';

import type { InvalidPluginManifest } from './validate-manifest.js';
import { validatePluginManifest } from './validate-manifest.js';
import { PluginRegistry } from './plugin-registry.js';
import type { RegisterablePluginManifest } from './plugin-registry.js';

const manifest = {
  apiVersion: 1,
  capabilities: ['gamepad-mapping'],
  id: 'org.example.generic-controller',
  name: 'Generic Controller',
  permissions: [],
  type: 'controller',
  version: '1.0.0',
};

const validManifest = () => {
  const result = validatePluginManifest(manifest);

  if (result.status !== 'valid') {
    throw new Error('Expected a valid plugin manifest fixture.');
  }

  return result;
};

const inactiveManifest = () => {
  const result = validatePluginManifest({ ...manifest, apiVersion: 2 });

  if (result.status !== 'inactive') {
    throw new Error('Expected an inactive plugin manifest fixture.');
  }

  return result;
};

test('registers and resolves an eligible plugin', async () => {
  const registry = new PluginRegistry();

  expect(await registry.register(validManifest())).toEqual({ ok: true, value: undefined });

  expect(await registry.resolve(manifest.id)).toMatchObject({
    ok: true,
    value: {
      id: manifest.id,
      value: {
        manifest: { id: manifest.id },
        status: 'eligible',
      },
    },
  });
});

test('lists and resolves an inactive plugin without making it eligible', async () => {
  const registry = new PluginRegistry();

  await registry.register(inactiveManifest());

  const listed = await registry.list();
  const resolved = await registry.resolve(manifest.id);

  expect(listed).toMatchObject({
    ok: true,
    value: [{ id: manifest.id, value: { status: 'inactive' } }],
  });
  expect(resolved).toMatchObject({
    ok: true,
    value: {
      id: manifest.id,
      value: {
        diagnostic: { code: 'unsupported-plugin-api-version' },
        status: 'inactive',
      },
    },
  });
});

test('preserves the first registered plugin when a duplicate identifier conflicts', async () => {
  const registry = new PluginRegistry();
  const original = validManifest();
  const duplicate = validatePluginManifest({ ...manifest, name: 'Replacement Controller' });

  await registry.register(original);

  if (duplicate.status !== 'valid') {
    throw new Error('Expected a valid duplicate plugin manifest fixture.');
  }

  expect(await registry.register(duplicate)).toMatchObject({
    error: { code: 'conflict' },
    ok: false,
  });
  expect(await registry.resolve(manifest.id)).toMatchObject({
    ok: true,
    value: { value: { manifest: { name: 'Generic Controller' } } },
  });
});

test('does not allow structurally invalid manifests into the registry type', () => {
  expectTypeOf<InvalidPluginManifest>().not.toMatchTypeOf<RegisterablePluginManifest>();
});
