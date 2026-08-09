import type {
  EmulatorAudioFrame,
  EmulatorInput,
  EmulatorOperationResult,
  EmulatorRom,
  EmulatorSession,
  EmulatorSessionStatus,
  EmulatorVideoFrame,
  UnsubscribeEmulatorOutput,
} from '@platform/emulator-sdk';

import { loadSameBoyWasm } from './sameboy-wasm.js';

const supportedExtensions = new Set(['.gb', '.gbc']);

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

export const createSameBoySession = async (): Promise<EmulatorSession> => {
  const wasm = await loadSameBoyWasm();
  return new SameBoySession(wasm);
};

class SameBoySession implements EmulatorSession {
  readonly #audioListeners = new Set<(frame: EmulatorAudioFrame) => void>();
  readonly #videoListeners = new Set<(frame: EmulatorVideoFrame) => void>();
  #hasRom = false;
  #status: EmulatorSessionStatus = 'idle';

  constructor(private readonly wasm: Awaited<ReturnType<typeof loadSameBoyWasm>>) {}

  getStatus(): EmulatorSessionStatus {
    return this.#status;
  }

  async loadRom(rom: EmulatorRom): Promise<EmulatorOperationResult> {
    if (!supportedExtensions.has(rom.extension.toLowerCase()) || rom.bytes.byteLength === 0) {
      return {
        code: 'invalid-rom',
        message: 'SameBoy supports non-empty .gb and .gbc ROMs.',
        status: 'error',
      };
    }

    const address = this.wasm.allocate(rom.bytes.byteLength);
    try {
      this.wasm.write(address, rom.bytes);
      if (!this.wasm.loadRom(address, rom.bytes.byteLength)) {
        return {
          code: 'invalid-rom',
          message: 'SameBoy could not load this ROM.',
          status: 'error',
        };
      }
    } finally {
      this.wasm.release(address);
    }

    this.#hasRom = true;
    return { status: 'ok' };
  }

  async pause(): Promise<EmulatorOperationResult> {
    if (this.#status !== 'running') {
      return invalidState('A running SameBoy session is required to pause.');
    }

    this.#status = 'paused';
    return { status: 'ok' };
  }

  async resume(): Promise<EmulatorOperationResult> {
    if (this.#status !== 'paused') {
      return invalidState('A paused SameBoy session is required to resume.');
    }

    this.#status = 'running';
    this.emitFrame();
    return { status: 'ok' };
  }

  async setInput(input: EmulatorInput): Promise<EmulatorOperationResult> {
    if (input.playerPortId !== 'player-one') {
      return invalidState('SameBoy supports only the player-one port.');
    }

    for (const action of input.actions) {
      const button = inputButtons[action];
      if (button !== undefined) {
        this.wasm.setButton(button, true);
      }
    }

    return { status: 'ok' };
  }

  async start(): Promise<EmulatorOperationResult> {
    if (!this.#hasRom) {
      return invalidState('A ROM must be loaded before starting SameBoy.');
    }
    if (this.#status !== 'idle' && this.#status !== 'stopped') {
      return invalidState('SameBoy can start only from an idle or stopped state.');
    }

    this.#status = 'running';
    this.emitFrame();
    return { status: 'ok' };
  }

  async stop(): Promise<EmulatorOperationResult> {
    if (this.#status === 'stopped') {
      return { status: 'ok' };
    }

    this.#status = 'stopped';
    return { status: 'ok' };
  }

  subscribeAudio(listener: (frame: EmulatorAudioFrame) => void): UnsubscribeEmulatorOutput {
    this.#audioListeners.add(listener);
    return () => this.#audioListeners.delete(listener);
  }

  subscribeVideo(listener: (frame: EmulatorVideoFrame) => void): UnsubscribeEmulatorOutput {
    this.#videoListeners.add(listener);
    return () => this.#videoListeners.delete(listener);
  }

  private emitFrame(): void {
    if (this.#status !== 'running') {
      return;
    }

    this.wasm.runFrame();
    const pixels = this.wasm.readFrame();
    const frame: EmulatorVideoFrame = {
      height: 144,
      pixelFormat: 'rgba8888',
      pixels,
      width: 160,
    };

    for (const listener of this.#videoListeners) {
      listener(frame);
    }
  }
}

const invalidState = (message: string): EmulatorOperationResult => ({
  code: 'invalid-state',
  message,
  status: 'error',
});
