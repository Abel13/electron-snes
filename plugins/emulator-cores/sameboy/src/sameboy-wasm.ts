const frameByteLength = 160 * 144 * 4;

interface SameBoyWasmExports extends WebAssembly.Exports {
  readonly memory: WebAssembly.Memory;
  readonly malloc: (size: number) => number;
  readonly free: (address: number) => void;
  readonly sameboy_frame_buffer: () => number;
  readonly sameboy_audio_sample_count: () => number;
  readonly sameboy_copy_audio: (output: number, maximumFrames: number) => number;
  readonly sameboy_load_rom: (address: number, size: number) => number;
  readonly sameboy_run_frame: () => void;
  readonly sameboy_set_button: (button: number, pressed: number) => void;
}

export interface SameBoyWasm {
  allocate(size: number): number;
  loadRom(address: number, size: number): boolean;
  readAudio(maximumFrames?: number): Float32Array;
  readFrame(): Uint8Array;
  release(address: number): void;
  runFrame(): void;
  setButton(button: number, pressed: boolean): void;
  write(address: number, bytes: Uint8Array): void;
}

export const loadSameBoyWasmFromBytes = async (
  bytes: BufferSource,
  imports: WebAssembly.Imports = {},
): Promise<SameBoyWasm> => {
  const { instance } = await WebAssembly.instantiate(bytes, imports);
  const exports = instance.exports as SameBoyWasmExports;
  const requiredFunctions = [
    exports.malloc,
    exports.free,
    exports.sameboy_frame_buffer,
    exports.sameboy_audio_sample_count,
    exports.sameboy_copy_audio,
    exports.sameboy_load_rom,
    exports.sameboy_run_frame,
    exports.sameboy_set_button,
  ];

  if (
    !(exports.memory instanceof WebAssembly.Memory) ||
    requiredFunctions.some((value) => typeof value !== 'function')
  ) {
    throw new Error('The SameBoy WebAssembly module has an incompatible export surface.');
  }

  return {
    allocate: (size) => exports.malloc(size),
    loadRom: (address, size) => exports.sameboy_load_rom(address, size) === 1,
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
    release: (address) => exports.free(address),
    runFrame: () => exports.sameboy_run_frame(),
    setButton: (button, pressed) => exports.sameboy_set_button(button, pressed ? 1 : 0),
    write: (address, bytesToWrite) =>
      new Uint8Array(exports.memory.buffer, address, bytesToWrite.byteLength).set(bytesToWrite),
  };
};
