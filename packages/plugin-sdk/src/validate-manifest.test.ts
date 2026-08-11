import { expect, test } from 'vitest';

import { validatePluginManifest } from './validate-manifest.js';

const validManifest = {
  apiVersion: 1,
  capabilities: ['gamepad-mapping'],
  id: 'org.example.generic-controller',
  name: 'Generic Controller',
  permissions: [],
  type: 'controller',
  version: '1.0.0',
};

test('returns an eligible manifest for the default supported API range', () => {
  const result = validatePluginManifest(validManifest);

  expect(result.status).toBe('valid');

  if (result.status === 'valid') {
    expect(result.compatibility.activation).toBe('eligible');
    expect(result.manifest.id).toBe('org.example.generic-controller');
  }
});

test('returns all safe diagnostics for malformed input', () => {
  const result = validatePluginManifest({
    apiVersion: 0,
    capabilities: ['Invalid Capability', 'Invalid Capability'],
    extra: true,
    id: 'invalid id',
    name: '',
    permissions: [],
    type: 'arcade',
    version: '1.0',
  });

  expect(result.status).toBe('invalid');

  if (result.status === 'invalid') {
    expect(result.diagnostics.length).toBeGreaterThan(1);
    expect(result.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'manifest-schema-invalid', path: ['apiVersion'] }),
        expect.objectContaining({ code: 'manifest-schema-invalid', path: ['type'] }),
      ]),
    );
    expect('error' in result).toBe(false);
  }
});

test('returns an inactive parsed manifest for an unsupported API revision', () => {
  const result = validatePluginManifest({ ...validManifest, apiVersion: 2 });

  expect(result.status).toBe('inactive');

  if (result.status === 'inactive') {
    expect(result.compatibility.activation).toBe('inactive');
    expect(result.diagnostic).toEqual({
      code: 'unsupported-plugin-api-version',
      message: 'The declared plugin API version is not supported by the host.',
      path: ['apiVersion'],
    });
    expect(result.manifest.apiVersion).toBe(2);
  }
});

test('accepts a revision supported by an expanded host range', () => {
  const result = validatePluginManifest(
    { ...validManifest, apiVersion: 2 },
    { supportedApiRange: { maxInclusive: 2, minInclusive: 1 } },
  );

  expect(result.status).toBe('valid');
});
