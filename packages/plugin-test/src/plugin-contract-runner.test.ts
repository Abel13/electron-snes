import { expect, test } from 'vitest';

import { validatePluginContract } from './plugin-contract-runner.js';

const consolePlugin = {
  console: {
    capabilities: ['cartridge-playback'],
    id: 'org.example.handheld',
    inputActions: [{ id: 'primary' }],
    inputMapping: {
      entries: [{ consoleAction: 'primary', normalizedAction: 'primary' }],
      playerPortId: 'player-one',
      version: 1,
    },
    playerPorts: [{ id: 'player-one', inputActions: ['primary'] }],
    supportedRomExtensions: ['.rom'],
  },
  manifest: {
    apiVersion: 1,
    capabilities: ['cartridge-playback'],
    id: 'org.example.handheld',
    name: 'Example Handheld',
    permissions: [],
    type: 'console',
    version: '1.0.0',
  },
} as const;

test('validates a compatible specialized plugin contract', () => {
  expect(validatePluginContract(consolePlugin)).toMatchObject({ status: 'valid', type: 'console' });
});

test('returns safe manifest diagnostics before definition validation', () => {
  const result = validatePluginContract({ manifest: { id: 'invalid' } });
  expect(result.status).toBe('invalid');
  if (result.status === 'invalid') {
    expect(result.diagnostics.length).toBeGreaterThan(1);
    expect(result.diagnostics.every(({ path }) => Array.isArray(path))).toBe(true);
  }
});

test('keeps unsupported API revisions inactive', () => {
  expect(
    validatePluginContract({
      ...consolePlugin,
      manifest: { ...consolePlugin.manifest, apiVersion: 2 },
    }),
  ).toMatchObject({ status: 'inactive', type: 'console' });
});

test('accepts an expanded host API range', () => {
  expect(
    validatePluginContract(
      { ...consolePlugin, manifest: { ...consolePlugin.manifest, apiVersion: 2 } },
      { supportedApiRange: { maxInclusive: 2, minInclusive: 1 } },
    ).status,
  ).toBe('valid');
});

test('normalizes specialized contract failures', () => {
  const result = validatePluginContract({
    ...consolePlugin,
    console: { ...consolePlugin.console, supportedRomExtensions: [] },
  });
  expect(result.status).toBe('invalid');
  if (result.status === 'invalid')
    expect(result.diagnostics[0]?.code).toBe('plugin-contract-invalid');
});

test('reports plugin types without a definition validator', () => {
  expect(
    validatePluginContract({ manifest: { ...consolePlugin.manifest, type: 'theme' } }),
  ).toEqual({
    diagnostics: [
      {
        code: 'plugin-contract-validator-unavailable',
        message: 'No public definition validator is available for plugin type theme.',
        path: ['manifest', 'type'],
      },
    ],
    status: 'invalid',
  });
});
