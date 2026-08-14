import { parentPort } from 'node:worker_threads';
import type {
  EmulatorOperationResult,
  EmulatorSaveStateResult,
  EmulatorSessionStatus,
  EmulatorStopResult,
} from '@platform/emulator-sdk';
import { loadMgbaWasm } from './mgba-wasm.js';
import type { MgbaWorkerMessage, MgbaWorkerRequest } from './mgba-worker-protocol.js';

if (parentPort === null) throw new Error('mGBA requires a worker message port.');
const port = parentPort;
const KEY_BITS: Readonly<Record<string, number>> = {
  a: 0,
  b: 1,
  select: 2,
  start: 3,
  right: 4,
  left: 5,
  up: 6,
  down: 7,
  r: 8,
  l: 9,
};
const wasm = await loadMgbaWasm();
let status: EmulatorSessionStatus = 'idle';
let hasRom = false;
let timer: ReturnType<typeof setTimeout> | undefined;
let nextFrameAt = 0;
let keyMask = 0;
port.on('message', (request: MgbaWorkerRequest) => void handle(request));
const ok = (): EmulatorOperationResult => ({ status: 'ok' });
const invalid = (message: string): EmulatorOperationResult => ({
  code: 'invalid-state',
  message,
  status: 'error',
});
const post = (message: MgbaWorkerMessage, transfer?: readonly ArrayBuffer[]): void =>
  port.postMessage(message, transfer);
const copyHeap = (pointer: number, bytes: number): Uint8Array =>
  wasm.HEAPU8.slice(pointer, pointer + bytes);

const loadRom = (
  extension: string,
  bytes: Uint8Array,
  cartridgeSave?: Uint8Array,
): EmulatorOperationResult => {
  if (extension !== '.gba' || bytes.byteLength === 0)
    return { code: 'invalid-rom', message: 'mGBA supports non-empty .gba ROMs.', status: 'error' };
  const rom = wasm._malloc(bytes.byteLength);
  try {
    wasm.HEAPU8.set(bytes, rom);
    if (!wasm._mgbawasm_load(rom, bytes.byteLength, 0, 0, 0, 0, 1))
      return { code: 'invalid-rom', message: 'mGBA could not load this ROM.', status: 'error' };
  } finally {
    wasm._free(rom);
  }
  if (cartridgeSave?.byteLength) {
    const save = wasm._malloc(cartridgeSave.byteLength);
    try {
      wasm.HEAPU8.set(cartridgeSave, save);
      if (!wasm._mgbawasm_sram_load(save, cartridgeSave.byteLength))
        return {
          code: 'invalid-rom',
          message: 'mGBA rejected the cartridge save.',
          status: 'error',
        };
    } finally {
      wasm._free(save);
    }
  }
  hasRom = true;
  status = 'idle';
  return ok();
};
const stopClock = (): void => {
  if (timer !== undefined) clearTimeout(timer);
  timer = undefined;
};
const start = (): EmulatorOperationResult => {
  if (!hasRom) return invalid('A ROM must be loaded before starting mGBA.');
  if (status !== 'idle' && status !== 'stopped')
    return invalid('mGBA can start only from idle or stopped.');
  status = 'running';
  nextFrameAt = performance.now();
  scheduleFrame();
  return ok();
};
const stop = (): EmulatorStopResult => {
  stopClock();
  status = 'stopped';
  const size = wasm._mgbawasm_sram_save();
  return size > 0
    ? { cartridgeSave: { bytes: copyHeap(wasm._mgbawasm_sram_ptr(), size) }, status: 'ok' }
    : ok();
};
const setInput = (portId: string, actions: readonly string[]): EmulatorOperationResult => {
  if (portId !== 'player-one') return invalid('mGBA supports only the player-one port.');
  keyMask = 0;
  for (const action of actions) {
    const bit = KEY_BITS[action];
    if (bit !== undefined) keyMask |= 1 << bit;
  }
  wasm._mgbawasm_set_keys(keyMask);
  return ok();
};
const captureSaveState = (): EmulatorSaveStateResult => {
  if (!hasRom || (status !== 'running' && status !== 'paused'))
    return {
      code: 'invalid-state',
      message: 'An active mGBA session is required.',
      status: 'error',
    };
  const size = wasm._mgbawasm_state_size();
  const pointer = wasm._malloc(size);
  try {
    if (!wasm._mgbawasm_state_save(pointer))
      return {
        code: 'unexpected',
        message: 'mGBA could not capture the save state.',
        status: 'error',
      };
    return {
      saveState: { bytes: copyHeap(pointer, size), coreId: 'org.pixelcore.mgba', formatVersion: 1 },
      status: 'ok',
    };
  } finally {
    wasm._free(pointer);
  }
};
const restoreSaveState = (state: {
  bytes: Uint8Array;
  coreId: string;
  formatVersion: number;
}): EmulatorOperationResult => {
  if (!hasRom || (status !== 'running' && status !== 'paused'))
    return invalid('An active mGBA session is required.');
  if (state.coreId !== 'org.pixelcore.mgba' || state.formatVersion !== 1)
    return invalid('The save state is incompatible with mGBA.');
  const pointer = wasm._malloc(state.bytes.byteLength);
  try {
    wasm.HEAPU8.set(state.bytes, pointer);
    return wasm._mgbawasm_state_load(pointer) ? ok() : invalid('mGBA rejected the save state.');
  } finally {
    wasm._free(pointer);
  }
};
const scheduleFrame = (): void => {
  if (status !== 'running') return;
  const now = performance.now();
  const frameMs = 1000 / 59.7275;
  nextFrameAt += frameMs;
  timer = setTimeout(runFrame, Math.max(0, nextFrameAt - now));
};
const runFrame = (): void => {
  if (status !== 'running') return;
  wasm._mgbawasm_run_frame();
  const width = wasm._mgbawasm_video_width();
  const height = wasm._mgbawasm_video_height();
  const pixels = copyHeap(wasm._mgbawasm_video_ptr(), width * height * 4);
  post({ height, pixels, type: 'video', width }, [pixels.buffer as ArrayBuffer]);
  const available = Math.min(wasm._mgbawasm_audio_available(), 4096);
  if (available > 0) {
    const pointer = wasm._malloc(available * 4);
    try {
      const count = wasm._mgbawasm_read_audio(pointer, available);
      const raw = new Int16Array(wasm.HEAPU8.buffer, pointer, count * 2);
      const samples = new Float32Array(count * 2);
      for (let i = 0; i < samples.length; i++) samples[i] = (raw[i] ?? 0) / 32768;
      post({ channels: 2, sampleRate: wasm._mgbawasm_sample_rate(), samples, type: 'audio' }, [
        samples.buffer as ArrayBuffer,
      ]);
    } finally {
      wasm._free(pointer);
    }
  }
  scheduleFrame();
};
const handle = async (request: MgbaWorkerRequest): Promise<void> => {
  let result: EmulatorOperationResult | EmulatorSaveStateResult | EmulatorStopResult;
  switch (request.type) {
    case 'load-rom':
      result = loadRom(request.rom.extension, request.rom.bytes, request.cartridgeSave?.bytes);
      break;
    case 'start':
      result = start();
      break;
    case 'pause':
      result =
        status === 'running'
          ? (stopClock(), (status = 'paused'), ok())
          : invalid('A running mGBA session is required to pause.');
      break;
    case 'resume':
      result =
        status === 'paused'
          ? ((status = 'running'), scheduleFrame(), ok())
          : invalid('A paused mGBA session is required to resume.');
      break;
    case 'stop':
      result = stop();
      break;
    case 'set-input':
      result = setInput(request.input.playerPortId, request.input.actions);
      break;
    case 'capture-save-state':
      result = captureSaveState();
      break;
    case 'restore-save-state':
      result = restoreSaveState(request.saveState);
      break;
    case 'set-fast-forward-active':
    case 'set-rewind-active':
      result = {
        code: 'unavailable',
        message: 'This mGBA integration does not expose this capability.',
        status: 'error',
      };
      break;
  }
  const transferable =
    result.status === 'ok' && 'cartridgeSave' in result && result.cartridgeSave
      ? [result.cartridgeSave.bytes.buffer as ArrayBuffer]
      : result.status === 'ok' && 'saveState' in result
        ? [result.saveState.bytes.buffer as ArrayBuffer]
        : undefined;
  post({ id: request.id, result, status, type: 'result' }, transferable);
};
