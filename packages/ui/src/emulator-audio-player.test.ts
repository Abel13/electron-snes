import { describe, expect, it, vi } from 'vitest';

import { EmulatorAudioPlayer } from './emulator-audio-player.js';

describe('EmulatorAudioPlayer', () => {
  it('does not create browser audio before explicit activation', () => {
    const createAudioContext = vi.fn();
    const player = new EmulatorAudioPlayer({ createAudioContext });

    player.enqueue({ channels: 2, sampleRate: 48000, samples: new Float32Array([0, 0]) });

    expect(createAudioContext).not.toHaveBeenCalled();
  });
});
