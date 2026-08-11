const frameByteLength = 160 * 144 * 4;

interface SameBoyWasmExports extends WebAssembly.Exports {
  readonly memory: WebAssembly.Memory;
  readonly __wasm_call_ctors: () => void;
  readonly malloc: (size: number) => number;
  readonly free: (address: number) => void;
  readonly sameboy_frame_buffer: () => number;
  readonly sameboy_audio_sample_count: () => number;
  readonly sameboy_copy_audio: (output: number, maximumFrames: number) => number;
  readonly sameboy_load_rom: (address: number, size: number) => number;
  readonly sameboy_run_frame: () => void;
  readonly sameboy_set_button: (button: number, pressed: number) => void;
  readonly sameboy_battery_size: () => number;
  readonly sameboy_battery_dirty: () => number;
  readonly sameboy_load_battery: (address: number, size: number) => number;
  readonly sameboy_copy_battery: (output: number, size: number) => number;
  readonly sameboy_save_state_size: () => number;
  readonly sameboy_copy_save_state: (output: number, size: number) => number;
  readonly sameboy_load_save_state: (address: number, size: number) => number;
}

export interface SameBoyWasm {
  allocate(size: number): number;
  loadRom(address: number, size: number): boolean;
  loadBattery(address: number, size: number): boolean;
  isBatteryDirty(): boolean;
  readBattery(): Uint8Array | undefined;
  readSaveState(): Uint8Array | undefined;
  readAudio(maximumFrames?: number): Float32Array;
  readFrame(): Uint8Array;
  release(address: number): void;
  runFrame(): void;
  setButton(button: number, pressed: boolean): void;
  loadSaveState(address: number, size: number): boolean;
  write(address: number, bytes: Uint8Array): void;
}

export const loadSameBoyWasmFromBytes = async (
  bytes: BufferSource,
  imports: WebAssembly.Imports = {},
  initialize?: (instance: WebAssembly.Instance) => void,
): Promise<SameBoyWasm> => {
  const { instance } = await WebAssembly.instantiate(bytes, imports);
  initialize?.(instance);
  const exports = instance.exports as SameBoyWasmExports;
  const requiredFunctions = [
    exports.malloc,
    exports.free,
    exports.__wasm_call_ctors,
    exports.sameboy_frame_buffer,
    exports.sameboy_audio_sample_count,
    exports.sameboy_copy_audio,
    exports.sameboy_load_rom,
    exports.sameboy_run_frame,
    exports.sameboy_set_button,
    exports.sameboy_battery_size,
    exports.sameboy_battery_dirty,
    exports.sameboy_load_battery,
    exports.sameboy_copy_battery,
    exports.sameboy_save_state_size,
    exports.sameboy_copy_save_state,
    exports.sameboy_load_save_state,
  ];

  if (
    !(exports.memory instanceof WebAssembly.Memory) ||
    requiredFunctions.some((value) => typeof value !== 'function')
  ) {
    throw new Error('The SameBoy WebAssembly module has an incompatible export surface.');
  }

  exports.__wasm_call_ctors();

  return {
    allocate: (size) => exports.malloc(size),
    loadRom: (address, size) => exports.sameboy_load_rom(address, size) === 1,
    loadBattery: (address, size) => exports.sameboy_load_battery(address, size) === 1,
    loadSaveState: (address, size) => exports.sameboy_load_save_state(address, size) === 1,
    isBatteryDirty: () => exports.sameboy_battery_dirty() === 1,
    readAudio: (maximumFrames = 4096) => {
      const frameCount = Math.min(exports.sameboy_audio_sample_count(), maximumFrames);
      if (frameCount === 0) return new Float32Array();

      const byteLength = frameCount * 2 * Int16Array.BYTES_PER_ELEMENT;
      const output = exports.malloc(byteLength);
      const copiedFrames = exports.sameboy_copy_audio(output, frameCount);
      const source = new Int16Array(exports.memory.buffer, output, copiedFrames * 2);
      const samples = Float32Array.from(source, (sample) => sample / 32768);
      exports.free(output);
      return samples;
    },
    readFrame: () =>
      new Uint8Array(
        exports.memory.buffer,
        exports.sameboy_frame_buffer(),
        frameByteLength,
      ).slice(),
    readBattery: () => {
      const byteLength = exports.sameboy_battery_size();
      if (byteLength === 0) return undefined;
      const output = exports.malloc(byteLength);
      try {
        const copied = exports.sameboy_copy_battery(output, byteLength);
        return copied === byteLength
          ? new Uint8Array(exports.memory.buffer, output, copied).slice()
          : undefined;
      } finally {
        exports.free(output);
      }
    },
    readSaveState: () => {
      const byteLength = exports.sameboy_save_state_size();
      if (byteLength === 0) return undefined;
      const output = exports.malloc(byteLength);
      try {
        const copied = exports.sameboy_copy_save_state(output, byteLength);
        return copied === byteLength
          ? new Uint8Array(exports.memory.buffer, output, copied).slice()
          : undefined;
      } finally {
        exports.free(output);
      }
    },
    release: (address) => exports.free(address),
    runFrame: () => exports.sameboy_run_frame(),
    setButton: (button, pressed) => exports.sameboy_set_button(button, pressed ? 1 : 0),
    write: (address, bytesToWrite) =>
      new Uint8Array(exports.memory.buffer, address, bytesToWrite.byteLength).set(bytesToWrite),
  };
};
