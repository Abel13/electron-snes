const frameByteLength = 160 * 144 * 4;

interface SameBoyWasmExports extends WebAssembly.Exports {
  readonly memory: WebAssembly.Memory;
  readonly malloc: (size: number) => number;
  readonly free: (address: number) => void;
  readonly sameboy_frame_buffer: () => number;
  readonly sameboy_load_rom: (address: number, size: number) => number;
  readonly sameboy_run_frame: () => void;
  readonly sameboy_set_button: (button: number, pressed: number) => void;
}

export interface SameBoyWasm {
  allocate(size: number): number;
  loadRom(address: number, size: number): boolean;
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
