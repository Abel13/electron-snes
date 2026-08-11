import { expect, test } from 'vitest';

import { defineController, validateControllerPlugin } from './controller.js';

const controller = defineController({
  controller: {
    id: 'org.example.generic-pad',
    mappings: [
      { input: { index: 12, kind: 'button' }, normalizedAction: 'move-up' },
      { input: { index: 0, kind: 'button' }, normalizedAction: 'primary' },
      {
        input: { direction: 'negative', index: 0, kind: 'axis', threshold: 0.65 },
        normalizedAction: 'move-left',
      },
    ],
    match: [{ nameIncludes: ['generic'], standardMapping: true }],
  },
  manifest: {
    apiVersion: 1,
    capabilities: ['gamepad-mapping'],
    id: 'org.example.generic-pad',
    name: 'Generic Pad',
    permissions: [],
    type: 'controller',
    version: '1.0.0',
  },
});

test('accepts a declarative controller definition', () => {
  expect(validateControllerPlugin(controller)).toEqual({ definition: controller, status: 'valid' });
});

test('rejects manifests for another plugin category', () => {
  const result = validateControllerPlugin({
    ...controller,
    manifest: { ...controller.manifest, type: 'console' },
  });

  expect(result.status).toBe('invalid');
  if (result.status === 'invalid')
    expect(result.diagnostics[0]?.code).toBe('controller-manifest-type-invalid');
});

test('rejects duplicate physical inputs and normalized actions', () => {
  const result = validateControllerPlugin({
    ...controller,
    controller: {
      ...controller.controller,
      mappings: [
        { input: { index: 0, kind: 'button' }, normalizedAction: 'primary' },
        { input: { index: 0, kind: 'button' }, normalizedAction: 'primary' },
      ],
    },
  });

  expect(result.status).toBe('invalid');
  if (result.status === 'invalid')
    expect(result.diagnostics.filter(({ path }) => path.at(-1) === 'mappings')).toHaveLength(2);
});

test('rejects unsupported physical input values', () => {
  const result = validateControllerPlugin({
    ...controller,
    controller: {
      ...controller.controller,
      mappings: [{ input: { index: 64, kind: 'button' }, normalizedAction: 'primary' }],
    },
  });

  expect(result.status).toBe('invalid');
  if (result.status === 'invalid')
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({ path: ['controller', 'mappings', 0, 'input'] }),
    );
});
