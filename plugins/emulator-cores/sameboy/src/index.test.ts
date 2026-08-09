import { validateEmulatorPlugin } from '@platform/emulator-sdk';
import { describe, expect, it } from 'vitest';

import { sameBoyEmulator } from './index.js';

describe('sameBoyEmulator', () => {
  it('declares a validated Game Boy family emulator plugin', () => {
    expect(validateEmulatorPlugin(sameBoyEmulator)).toEqual({ status: 'ok' });
    expect(sameBoyEmulator.emulator.compatibleConsoleIds).toEqual([
      'org.pixelcore.game-boy-family',
    ]);
    expect(sameBoyEmulator.emulator.supportedRomExtensions).toEqual(['.gb', '.gbc']);
  });

  it('does not advertise deferred advanced capabilities', () => {
    expect(sameBoyEmulator.emulator.capabilities).toEqual({
      fastForward: false,
      rewind: false,
      saveStates: false,
    });
  });
});
