import { validatePluginContract } from '@platform/plugin-test';
import { describe, expect, it } from 'vitest';

import { sameBoyEmulator } from './index.js';

describe('sameBoyEmulator', () => {
  it('declares a validated Game Boy family emulator plugin', () => {
    expect(validatePluginContract(sameBoyEmulator)).toMatchObject({
      status: 'valid',
      type: 'emulator-core',
    });
    expect(sameBoyEmulator.emulator.compatibleConsoleIds).toEqual([
      'org.pixelcore.game-boy-family',
    ]);
    expect(sameBoyEmulator.emulator.supportedRomExtensions).toEqual(['.gb', '.gbc']);
  });

  it('advertises only implemented advanced capabilities', () => {
    expect(sameBoyEmulator.emulator.capabilities).toEqual({
      fastForward: false,
      rewind: false,
      saveStates: true,
    });
  });
});
