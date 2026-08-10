import type {
  EmulatorAudioFrame,
  EmulatorOperationResult,
  EmulatorPluginDefinition,
  EmulatorRom,
  EmulatorSession,
  EmulatorSessionStatus,
  EmulatorVideoFrame,
  UnsubscribeEmulatorOutput,
} from '@platform/emulator-sdk';

export interface EmulatorSessionOutputs {
  readonly onAudio?: (frame: EmulatorAudioFrame) => void;
  readonly onVideo?: (frame: EmulatorVideoFrame) => void;
}

/** Coordinates one injected emulator plugin session without loading plugin code. */
export class EmulatorSessionController {
  #session: EmulatorSession | undefined;
  #status: EmulatorSessionStatus = 'idle';
  #unsubscribe: readonly UnsubscribeEmulatorOutput[] = [];

  public constructor(
    private readonly plugin: EmulatorPluginDefinition,
    private readonly outputs: EmulatorSessionOutputs = {},
  ) {}

  public getStatus(): EmulatorSessionStatus {
    return this.#status;
  }

  public async launch(rom: EmulatorRom): Promise<EmulatorOperationResult> {
    if (this.#session !== undefined) return invalidState('An emulator session is already active.');

    this.#status = 'starting';
    let session: EmulatorSession;
    try {
      session = await this.plugin.createSession();
    } catch {
      this.#status = 'failed';
      return unexpected('The emulator session could not be created.');
    }

    this.#session = session;
    this.#unsubscribe = [
      session.subscribeAudio((frame) => this.publishAudio(frame)),
      session.subscribeVideo((frame) => this.publishVideo(frame)),
    ];

    const loaded = await session.loadRom(rom);
    if (loaded.status === 'error') return this.failLaunch(loaded);

    const started = await session.start();
    if (started.status === 'error') return this.failLaunch(started);

    this.#status = session.getStatus();
    return started;
  }

  public async pause(): Promise<EmulatorOperationResult> {
    const session = this.#session;
    if (session === undefined)
      return invalidState('An active emulator session is required to pause.');
    const result = await session.pause();
    if (result.status === 'ok') this.#status = session.getStatus();
    return result;
  }

  public async resume(): Promise<EmulatorOperationResult> {
    const session = this.#session;
    if (session === undefined)
      return invalidState('An active emulator session is required to resume.');
    const result = await session.resume();
    if (result.status === 'ok') this.#status = session.getStatus();
    return result;
  }

  public async stop(): Promise<EmulatorOperationResult> {
    const session = this.#session;
    if (session === undefined)
      return invalidState('An active emulator session is required to stop.');

    this.#status = 'stopping';
    const result = await session.stop();
    if (result.status === 'error') {
      this.#status = session.getStatus();
      return result;
    }

    this.dispose();
    this.#status = 'stopped';
    return result;
  }

  private async failLaunch(result: EmulatorOperationResult): Promise<EmulatorOperationResult> {
    const session = this.#session;
    if (session !== undefined) await session.stop();
    this.dispose();
    this.#status = 'failed';
    return result;
  }

  private dispose(): void {
    for (const unsubscribe of this.#unsubscribe) unsubscribe();
    this.#unsubscribe = [];
    this.#session = undefined;
  }

  private publishAudio(frame: EmulatorAudioFrame): void {
    try {
      this.outputs.onAudio?.(frame);
    } catch {
      // Renderer output failures must not stop an emulator session.
    }
  }

  private publishVideo(frame: EmulatorVideoFrame): void {
    try {
      this.outputs.onVideo?.(frame);
    } catch {
      // Renderer output failures must not stop an emulator session.
    }
  }
}

const invalidState = (message: string): EmulatorOperationResult => ({
  code: 'invalid-state',
  message,
  status: 'error',
});

const unexpected = (message: string): EmulatorOperationResult => ({
  code: 'unexpected',
  message,
  status: 'error',
});
