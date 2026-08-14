import { validatePluginContract } from '@platform/plugin-test';
import { expect, test } from 'vitest';
import { gameBoyAdvanceConsole } from './index.js';

test('declares the GBA console contract', () => {
  expect(validatePluginContract(gameBoyAdvanceConsole).status).toBe('valid');
  expect(gameBoyAdvanceConsole.console.supportedRomExtensions).toEqual(['.gba']);
  expect(gameBoyAdvanceConsole.console.videoPresentation?.nativeResolution).toEqual({ width: 240, height: 160 });
});

test('extracts title and game code from a valid GBA header', () => {
  const rom = new Uint8Array(0xb0);
  rom.set(new TextEncoder().encode('PIXELCORE'), 0xa0);
  rom.set(new TextEncoder().encode('ABCD'), 0xac);
  expect(gameBoyAdvanceConsole.console.identifyRom?.(rom)).toEqual([
    { namespace: 'gba-header-title', value: 'PIXELCORE' },
    { namespace: 'gba-game-code', value: 'ABCD' },
  ]);
});

test('rejects truncated and malformed GBA headers', () => {
  expect(gameBoyAdvanceConsole.console.identifyRom?.(new Uint8Array(10))).toEqual([]);
  const rom = new Uint8Array(0xb0);
  rom.set(new TextEncoder().encode('PIXELCORE'), 0xa0);
  rom.set(new TextEncoder().encode('bad!'), 0xac);
  expect(gameBoyAdvanceConsole.console.identifyRom?.(rom)).toEqual([]);
});
