export interface EmulatorAudioFrameData {
  readonly channels: 1 | 2;
  readonly sampleRate: number;
  readonly samples: Float32Array;
}

export interface EmulatorAudioPlayerOptions {
  readonly createAudioContext?: () => AudioContext;
}

/** Renderer-only game-audio scheduler. Activate it from a user gesture before enqueueing frames. */
export class EmulatorAudioPlayer {
  readonly #createAudioContext: () => AudioContext;
  #context: AudioContext | undefined;
  #nextStartTime = 0;
  #sources = new Set<AudioBufferSourceNode>();
  readonly #maximumScheduledLeadSeconds = 0.12;

  public constructor(options: EmulatorAudioPlayerOptions = {}) {
    this.#createAudioContext = options.createAudioContext ?? (() => new AudioContext());
  }

  public async start(): Promise<void> {
    this.#context ??= this.#createAudioContext();
    await this.#context.resume();
    this.#nextStartTime = this.#context.currentTime;
  }

  public enqueue(frame: EmulatorAudioFrameData): void {
    const context = this.#context;
    if (context === undefined || context.state !== 'running' || frame.samples.length === 0) return;
    if (this.#nextStartTime - context.currentTime > this.#maximumScheduledLeadSeconds) return;

    const frames = frame.samples.length / frame.channels;
    if (!Number.isInteger(frames)) return;

    const buffer = context.createBuffer(frame.channels, frames, frame.sampleRate);
    for (let channel = 0; channel < frame.channels; channel += 1) {
      const output = buffer.getChannelData(channel);
      for (let index = 0; index < frames; index += 1) {
        output[index] = frame.samples[index * frame.channels + channel] ?? 0;
      }
    }

    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    source.onended = () => this.#sources.delete(source);
    const startTime = Math.max(context.currentTime, this.#nextStartTime);
    source.start(startTime);
    this.#nextStartTime = startTime + buffer.duration;
    this.#sources.add(source);
  }

  public stop(): void {
    for (const source of this.#sources) source.stop();
    this.#sources.clear();
    this.#nextStartTime = this.#context?.currentTime ?? 0;
  }
}
