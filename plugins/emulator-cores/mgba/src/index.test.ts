import { validatePluginContract } from '@platform/plugin-test';
import { expect, test } from 'vitest';
import { mgbaEmulator } from './index.js';

test('declares a GBA-only mGBA emulator plugin with honest capabilities', () => {
  expect(validatePluginContract(mgbaEmulator).status).toBe('valid');
  expect(mgbaEmulator.emulator.compatibleConsoleIds).toEqual(['org.pixelcore.game-boy-advance']);
  expect(mgbaEmulator.emulator.supportedRomExtensions).toEqual(['.gba']);
  expect(mgbaEmulator.emulator.capabilities).toEqual({
    fastForward: false,
    rewind: false,
    saveStates: true,
  });
});
