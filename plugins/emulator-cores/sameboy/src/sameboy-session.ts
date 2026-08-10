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
import { Worker } from 'node:worker_threads';

import type {
  SameBoyWorkerCommand,
  SameBoyWorkerMessage,
  SameBoyWorkerRequest,
} from './sameboy-worker-protocol.js';

export const createSameBoySession = async (): Promise<EmulatorSession> =>
  new SameBoyWorkerSession(new Worker(new URL('./sameboy-worker.js', import.meta.url)));

interface WorkerPort {
  on(event: 'message', listener: (message: SameBoyWorkerMessage) => void): void;
  on(event: 'error', listener: (error: Error) => void): void;
  on(event: 'exit', listener: (code: number) => void): void;
  postMessage(message: SameBoyWorkerRequest, transferList?: readonly ArrayBuffer[]): void;
  terminate(): Promise<number>;
}

class SameBoyWorkerSession implements EmulatorSession {
  readonly #audioListeners = new Set<(frame: EmulatorAudioFrame) => void>();
  readonly #pending = new Map<string, (result: EmulatorOperationResult) => void>();
  readonly #videoListeners = new Set<(frame: EmulatorVideoFrame) => void>();
  #requestId = 0;
  #status: EmulatorSessionStatus = 'idle';

  constructor(private readonly worker: WorkerPort) {
    worker.on('message', this.onMessage);
    worker.on('error', this.onFailure);
    worker.on('exit', this.onExit);
  }

  getStatus(): EmulatorSessionStatus {
    return this.#status;
  }

  loadRom(rom: EmulatorRom): Promise<EmulatorOperationResult> {
    return this.request({ rom, type: 'load-rom' });
  }

  pause(): Promise<EmulatorOperationResult> {
    return this.request({ type: 'pause' });
  }

  resume(): Promise<EmulatorOperationResult> {
    return this.request({ type: 'resume' });
  }

  setInput(input: EmulatorInput): Promise<EmulatorOperationResult> {
    return this.request({ input, type: 'set-input' });
  }

  start(): Promise<EmulatorOperationResult> {
    return this.request({ type: 'start' });
  }

  async stop(): Promise<EmulatorOperationResult> {
    const result = await this.request({ type: 'stop' });
    if (result.status === 'ok') await this.worker.terminate();
    return result;
  }

  subscribeAudio(listener: (frame: EmulatorAudioFrame) => void): UnsubscribeEmulatorOutput {
    this.#audioListeners.add(listener);
    return () => this.#audioListeners.delete(listener);
  }

  subscribeVideo(listener: (frame: EmulatorVideoFrame) => void): UnsubscribeEmulatorOutput {
    this.#videoListeners.add(listener);
    return () => this.#videoListeners.delete(listener);
  }

  private readonly onExit = (code: number): void => {
    if (code !== 0 && this.#status !== 'stopped')
      this.fail('The SameBoy worker stopped unexpectedly.');
  };

  private readonly onFailure = (error: Error): void => {
    console.error('The SameBoy worker failed.', error);
    this.fail('The SameBoy worker failed.');
  };

  private readonly onMessage = (message: SameBoyWorkerMessage): void => {
    if (message.type === 'result') {
      this.#status = message.status;
      const resolve = this.#pending.get(message.id);
      if (resolve) {
        this.#pending.delete(message.id);
        resolve(message.result);
      }
      return;
    }

    if (message.type === 'video') {
      const frame: EmulatorVideoFrame = {
        height: message.height,
        pixelFormat: 'rgba8888',
        pixels: message.pixels,
        width: message.width,
      };
      for (const listener of this.#videoListeners) listener(frame);
      return;
    }

    const frame: EmulatorAudioFrame = {
      channels: message.channels,
      sampleRate: message.sampleRate,
      samples: message.samples,
    };
    for (const listener of this.#audioListeners) listener(frame);
  };

  private fail(message: string): void {
    this.#status = 'failed';
    for (const resolve of this.#pending.values()) {
      resolve({ code: 'unexpected', message, status: 'error' });
    }
    this.#pending.clear();
  }

  private request(
    command: SameBoyWorkerCommand,
    transferList?: readonly ArrayBuffer[],
  ): Promise<EmulatorOperationResult> {
    const id = `sameboy-${this.#requestId++}`;
    return new Promise((resolve) => {
      this.#pending.set(id, resolve);
      this.worker.postMessage({ ...command, id } as SameBoyWorkerRequest, transferList);
    });
  }
}
