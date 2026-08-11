import { expect, test } from 'vitest';

import {
  defineEmulator,
  validateEmulatorPlugin,
  validateEmulatorSessionCapabilities,
} from './emulator.js';

const definition = defineEmulator({
  createSession: async () => ({
    captureSaveState: async () => ({
      saveState: {
        bytes: new Uint8Array([1, 2, 3]),
        coreId: 'org.pixelcore.reference-emulator',
        formatVersion: 1,
      },
      status: 'ok' as const,
    }),
    getStatus: () => 'idle' as const,
    loadRom: async () => ({ status: 'ok' as const }),
    pause: async () => ({ status: 'ok' as const }),
    resume: async () => ({ status: 'ok' as const }),
    restoreSaveState: async () => ({ status: 'ok' as const }),
    setInput: async () => ({ status: 'ok' as const }),
    start: async () => ({ status: 'ok' as const }),
    stop: async () => ({ status: 'ok' as const }),
    subscribeAudio: () => () => undefined,
    subscribeCartridgeSave: () => () => undefined,
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

test('requires save-state operations when the capability is declared', async () => {
  const session = await definition.createSession();
  expect(validateEmulatorSessionCapabilities(session, definition.emulator.capabilities)).toEqual({
    status: 'ok',
  });

  const unsupported = {
    getStatus: session.getStatus,
    loadRom: session.loadRom,
    pause: session.pause,
    resume: session.resume,
    setInput: session.setInput,
    start: session.start,
    stop: session.stop,
    subscribeAudio: session.subscribeAudio,
    subscribeCartridgeSave: session.subscribeCartridgeSave,
    subscribeVideo: session.subscribeVideo,
  };
  expect(
    validateEmulatorSessionCapabilities(unsupported, definition.emulator.capabilities),
  ).toMatchObject({ code: 'unavailable', status: 'error' });
});

test('requires a rewind operation only when the capability is declared', async () => {
  const session = await definition.createSession();
  expect(
    validateEmulatorSessionCapabilities(session, {
      ...definition.emulator.capabilities,
      rewind: false,
    }),
  ).toEqual({ status: 'ok' });
  expect(
    validateEmulatorSessionCapabilities(session, {
      ...definition.emulator.capabilities,
      rewind: true,
    }),
  ).toMatchObject({ code: 'unavailable', status: 'error' });
  expect(
    validateEmulatorSessionCapabilities(
      { ...session, setRewindActive: async () => ({ status: 'ok' }) },
      { ...definition.emulator.capabilities, rewind: true },
    ),
  ).toEqual({ status: 'ok' });
});

test('requires a fast-forward operation only when the capability is declared', async () => {
  const session = await definition.createSession();
  expect(
    validateEmulatorSessionCapabilities(session, {
      ...definition.emulator.capabilities,
      fastForward: false,
    }),
  ).toEqual({ status: 'ok' });
  expect(
    validateEmulatorSessionCapabilities(session, {
      ...definition.emulator.capabilities,
      fastForward: true,
    }),
  ).toMatchObject({ code: 'unavailable', status: 'error' });
  expect(
    validateEmulatorSessionCapabilities(
      { ...session, setFastForwardActive: async () => ({ status: 'ok' }) },
      { ...definition.emulator.capabilities, fastForward: true },
    ),
  ).toEqual({ status: 'ok' });
});
