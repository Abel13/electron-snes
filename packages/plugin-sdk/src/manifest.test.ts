import { expect, test } from 'vitest';

import { PluginManifestSchema } from './manifest.js';

const validManifest = {
  apiVersion: 1,
  capabilities: ['gamepad-mapping'],
  id: 'org.example.generic-controller',
  name: 'Generic Controller',
  permissions: [
    { actions: ['read'], reason: 'Read device metadata.', resource: 'device:metadata' },
  ],
  type: 'controller',
  version: '1.0.0',
};

test('accepts a complete valid plugin manifest', () => {
  const result = PluginManifestSchema.safeParse(validManifest);

  expect(result.success).toBe(true);
});

test('rejects unknown root fields and invalid identity values', () => {
  expect(PluginManifestSchema.safeParse({ ...validManifest, extra: true }).success).toBe(false);
  expect(
    PluginManifestSchema.safeParse({ ...validManifest, id: 'Generic Controller' }).success,
  ).toBe(false);
  expect(PluginManifestSchema.safeParse({ ...validManifest, version: '1.0' }).success).toBe(false);
});

test('rejects non-positive and non-integer API revisions', () => {
  expect(PluginManifestSchema.safeParse({ ...validManifest, apiVersion: 0 }).success).toBe(false);
  expect(PluginManifestSchema.safeParse({ ...validManifest, apiVersion: 1.5 }).success).toBe(false);
});

test('rejects unsupported types and invalid capabilities', () => {
  expect(PluginManifestSchema.safeParse({ ...validManifest, type: 'arcade' }).success).toBe(false);
  expect(
    PluginManifestSchema.safeParse({ ...validManifest, capabilities: ['Gamepad Mapping'] }).success,
  ).toBe(false);
  expect(
    PluginManifestSchema.safeParse({
      ...validManifest,
      capabilities: ['gamepad-mapping', 'gamepad-mapping'],
    }).success,
  ).toBe(false);
});

test('rejects malformed and duplicated permission declarations', () => {
  expect(
    PluginManifestSchema.safeParse({
      ...validManifest,
      permissions: [{ actions: [], resource: 'device:metadata' }],
    }).success,
  ).toBe(false);
  expect(
    PluginManifestSchema.safeParse({
      ...validManifest,
      permissions: [
        { actions: ['read'], resource: 'device:metadata' },
        { actions: ['write'], resource: 'device:metadata' },
      ],
    }).success,
  ).toBe(false);
});
