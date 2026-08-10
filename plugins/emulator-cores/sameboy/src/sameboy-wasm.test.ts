import { readFile } from 'node:fs/promises';
import { WASI } from 'node:wasi';

import { describe, expect, it } from 'vitest';

import { loadSameBoyWasmFromBytes } from './sameboy-wasm.js';

const nintendoLogo = [
  0xce, 0xed, 0x66, 0x66, 0xcc, 0x0d, 0x00, 0x0b, 0x03, 0x73, 0x00, 0x83, 0x00, 0x0c, 0x00, 0x0d,
  0x00, 0x08, 0x11, 0x1f, 0x88, 0x89, 0x00, 0x0e, 0xdc, 0xcc, 0x6e, 0xe6, 0xdd, 0xdd, 0xd9, 0x99,
  0xbb, 0xbb, 0x67, 0x63, 0x6e, 0x0e, 0xec, 0xcc, 0xdd, 0xdc, 0x99, 0x9f, 0xbb, 0xb9, 0x33, 0x3e,
] as const;

const createToneRom = (): Uint8Array => {
  const rom = new Uint8Array(0x8000);
  rom.set([0xc3, 0x50, 0x01], 0x100);
  rom.set(nintendoLogo, 0x104);
  rom.set(new TextEncoder().encode('PIXELCORE TONE'), 0x134);
  rom[0x143] = 0x80;
  rom[0x147] = 0;
  rom[0x148] = 0;
  rom[0x149] = 0;
  rom[0x14a] = 1;
  rom[0x14b] = 0x33;

  let headerChecksum = 0;
  for (let address = 0x134; address <= 0x14c; address += 1)
    headerChecksum = (headerChecksum - rom[address]! - 1) & 0xff;
  rom[0x14d] = headerChecksum;

  rom.set(
    [
      0xf3, 0x3e, 0x80, 0xea, 0x26, 0xff, 0x3e, 0x77, 0xea, 0x24, 0xff, 0x3e, 0x11, 0xea, 0x25,
      0xff, 0x3e, 0x80, 0xea, 0x11, 0xff, 0x3e, 0xf0, 0xea, 0x12, 0xff, 0x3e, 0x00, 0xea, 0x13,
      0xff, 0x3e, 0x87, 0xea, 0x14, 0xff, 0xc3, 0x74, 0x01,
    ],
    0x150,
  );

  let globalChecksum = 0;
  for (let address = 0; address < rom.length; address += 1) {
    if (address !== 0x14e && address !== 0x14f)
      globalChecksum = (globalChecksum + rom[address]!) & 0xffff;
  }
  rom[0x14e] = globalChecksum >> 8;
  rom[0x14f] = globalChecksum & 0xff;
  return rom;
};

describe('SameBoy WASM audio', () => {
  it('runs static constructors and emits normalized stereo PCM', async () => {
    const wasi = new WASI({ version: 'preview1' });
    const wasm = await loadSameBoyWasmFromBytes(
      await readFile(new URL('../wasm/sameboy.wasm', import.meta.url)),
      { wasi_snapshot_preview1: wasi.wasiImport },
      (instance) => wasi.initialize(instance),
    );
    const rom = createToneRom();
    const address = wasm.allocate(rom.byteLength);
    wasm.write(address, rom);
    expect(wasm.loadRom(address, rom.byteLength)).toBe(true);
    wasm.release(address);

    let peak = 0;
    for (let frame = 0; frame < 240; frame += 1) {
      wasm.runFrame();
      for (const sample of wasm.readAudio()) peak = Math.max(peak, Math.abs(sample));
    }

    expect(peak).toBeGreaterThan(0);
    expect(peak).toBeLessThanOrEqual(1);
  });
});
