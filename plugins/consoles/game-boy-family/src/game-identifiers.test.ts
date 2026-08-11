import { expect, test } from 'vitest';

import { gameBoyFamilyConsole } from './index.js';

test('extracts a generic title identifier from the Game Boy header', () => {
  const rom = new Uint8Array(0x150);
  rom.set(new TextEncoder().encode('PIXELCORE DEMO'), 0x134);
  expect(gameBoyFamilyConsole.console.identifyRom?.(rom)).toEqual([
    { namespace: 'game-boy-header-title', value: 'PIXELCORE DEMO' },
  ]);
});

test('does not identify truncated or malformed ROM headers', () => {
  expect(gameBoyFamilyConsole.console.identifyRom?.(new Uint8Array(10))).toEqual([]);
  const rom = new Uint8Array(0x150);
  rom.fill(0xff, 0x134, 0x144);
  expect(gameBoyFamilyConsole.console.identifyRom?.(rom)).toEqual([]);
});
