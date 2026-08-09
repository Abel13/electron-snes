import { expect, test } from 'vitest';

import { defineEmulator, validateEmulatorPlugin } from './emulator.js';

const definition = defineEmulator({
  createSession: async () => ({
    getStatus: () => 'idle' as const,
    loadRom: async () => ({ status: 'ok' as const }),
    pause: async () => ({ status: 'ok' as const }),
    resume: async () => ({ status: 'ok' as const }),
    setInput: async () => ({ status: 'ok' as const }),
    start: async () => ({ status: 'ok' as const }),
    stop: async () => ({ status: 'ok' as const }),
    subscribeAudio: () => () => undefined,
    subscribeVideo: () => () => undefined,
  }),
  emulator: {
    capabilities: { fastForward: false, rewind: false, saveStates: true },
    compatibleConsoleIds: ['org.pixelcore.game-boy-family'],
    id: 'org.pixelcore.reference-emulator',
    supportedRomExtensions: ['.gb', '.gbc'],
  },
  manifest: {
    apiVersion: 1,
    capabilities: ['rom-execution'],
    id: 'org.pixelcore.reference-emulator',
    name: 'Reference Emulator',
    permissions: [],
    type: 'emulator-core',
    version: '1.0.0',
  },
});

test('accepts a typed emulator-core declaration', () => {
  expect(validateEmulatorPlugin(definition)).toEqual({ status: 'ok' });
});

test('rejects an emulator declaration with an unsupported manifest type', () => {
  expect(
    validateEmulatorPlugin({
      ...definition,
      manifest: { ...definition.manifest, type: 'console' },
    }),
  ).toMatchObject({ code: 'unavailable', status: 'error' });
});
