import { readFile } from 'node:fs/promises';
import { parentPort } from 'node:worker_threads';
import { WASI } from 'node:wasi';

import type { EmulatorOperationResult, EmulatorSessionStatus } from '@platform/emulator-sdk';

import { loadSameBoyWasmFromBytes } from './sameboy-wasm.js';
import type { SameBoyWorkerMessage, SameBoyWorkerRequest } from './sameboy-worker-protocol.js';

if (parentPort === null) throw new Error('SameBoy requires a worker message port.');

const port = parentPort;
const inputButtons: Readonly<Record<string, number>> = {
  a: 4,
  b: 5,
  down: 3,
  left: 1,
  right: 0,
  select: 6,
  start: 7,
  up: 2,
};
const wasi = new WASI({ version: 'preview1' });
const wasm = await loadSameBoyWasmFromBytes(
  await readFile(new URL('../wasm/sameboy.wasm', import.meta.url)),
  { wasi_snapshot_preview1: wasi.wasiImport },
);
let hasRom = false;
let status: EmulatorSessionStatus = 'idle';
let timer: ReturnType<typeof setTimeout> | undefined;

port.on('message', (request: SameBoyWorkerRequest) => {
  void handle(request);
});

const handle = async (request: SameBoyWorkerRequest): Promise<void> => {
  let result: EmulatorOperationResult;
  switch (request.type) {
    case 'load-rom':
      result = loadRom(request.rom.extension, request.rom.bytes);
      break;
    case 'start':
      result = start();
      break;
    case 'pause':
      result =
        status === 'running'
          ? (stopClock(), (status = 'paused'), ok())
          : invalid('A running SameBoy session is required to pause.');
      break;
    case 'resume':
      result =
        status === 'paused'
          ? ((status = 'running'), scheduleFrame(), ok())
          : invalid('A paused SameBoy session is required to resume.');
      break;
    case 'stop':
      stopClock();
      status = 'stopped';
      result = ok();
      break;
    case 'set-input':
      result = setInput(request.input.playerPortId, request.input.actions);
      break;
  }
  post({ id: request.id, result, status, type: 'result' });
};

const loadRom = (extension: string, bytes: Uint8Array): EmulatorOperationResult => {
  if ((extension !== '.gb' && extension !== '.gbc') || bytes.byteLength === 0)
    return {
      code: 'invalid-rom',
      message: 'SameBoy supports non-empty .gb and .gbc ROMs.',
      status: 'error',
    };
  const address = wasm.allocate(bytes.byteLength);
  try {
    wasm.write(address, bytes);
    if (!wasm.loadRom(address, bytes.byteLength))
      return { code: 'invalid-rom', message: 'SameBoy could not load this ROM.', status: 'error' };
  } finally {
    wasm.release(address);
  }
  hasRom = true;
  return ok();
};
const start = (): EmulatorOperationResult => {
  if (!hasRom) return invalid('A ROM must be loaded before starting SameBoy.');
  if (status !== 'idle' && status !== 'stopped')
    return invalid('SameBoy can start only from an idle or stopped state.');
  status = 'running';
  scheduleFrame();
  return ok();
};
const setInput = (portId: string, actions: readonly string[]): EmulatorOperationResult => {
  if (portId !== 'player-one') return invalid('SameBoy supports only the player-one port.');
  for (const action of actions) {
    const button = inputButtons[action];
    if (button !== undefined) wasm.setButton(button, true);
  }
  return ok();
};
const scheduleFrame = (): void => {
  if (status === 'running') timer = setTimeout(runFrame, 16);
};
const runFrame = (): void => {
  if (status !== 'running') return;
  wasm.runFrame();
  const pixels = wasm.readFrame();
  const buffer = pixels.buffer;
  if (buffer instanceof ArrayBuffer)
    post({ height: 144, pixels, type: 'video', width: 160 }, [buffer]);
  else post({ height: 144, pixels, type: 'video', width: 160 });
  scheduleFrame();
};
const stopClock = (): void => {
  if (timer !== undefined) clearTimeout(timer);
  timer = undefined;
};
const ok = (): EmulatorOperationResult => ({ status: 'ok' });
const invalid = (message: string): EmulatorOperationResult => ({
  code: 'invalid-state',
  message,
  status: 'error',
});
const post = (message: SameBoyWorkerMessage, transferList?: readonly ArrayBuffer[]): void =>
  port.postMessage(message, transferList);
