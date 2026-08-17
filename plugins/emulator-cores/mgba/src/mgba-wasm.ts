import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';

export interface MgbaModule {
  readonly HEAPU8: Uint8Array;
  _malloc(size: number): number;
  _free(pointer: number): void;
  _mgbawasm_init(): void;
  _mgbawasm_load(
    rom: number,
    bytes: number,
    bios: number,
    biosBytes: number,
    platform: number,
    gbModel: number,
    skipBios: number,
  ): number;
  _mgbawasm_unload(): void;
  _mgbawasm_platform(): number;
  _mgbawasm_run_frame(): void;
  _mgbawasm_video_ptr(): number;
  _mgbawasm_video_width(): number;
  _mgbawasm_video_height(): number;
  _mgbawasm_framerate_micro(): number;
  _mgbawasm_sample_rate(): number;
  _mgbawasm_audio_available(): number;
  _mgbawasm_read_audio(pointer: number, frames: number): number;
  _mgbawasm_set_keys(keys: number): void;
  _mgbawasm_state_size(): number;
  _mgbawasm_state_save(pointer: number): number;
  _mgbawasm_state_load(pointer: number, bytes: number): number;
  _mgbawasm_sram_save(): number;
  _mgbawasm_sram_ptr(): number;
  _mgbawasm_sram_load(pointer: number, bytes: number): number;
  _mgbawasm_has_bios(): number;
}

type MgbaFactory = (options: { readonly wasmBinary: Uint8Array }) => Promise<MgbaModule>;

export const loadMgbaWasm = async (): Promise<MgbaModule> => {
  const require = createRequire(import.meta.url);
  const loaded = require('../wasm/mgba.cjs') as { default?: MgbaFactory } | MgbaFactory;
  const factory = typeof loaded === 'function' ? loaded : loaded.default;
  if (factory === undefined) throw new Error('The mGBA WASM factory could not be loaded.');
  const wasm = new Uint8Array(await readFile(new URL('../wasm/mgba.wasm', import.meta.url)));
  const module = await factory({ wasmBinary: wasm });
  module._mgbawasm_init();
  return module;
};
