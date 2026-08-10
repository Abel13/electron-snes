import { describe, expect, it } from 'vitest';

import type { SameBoyWorkerMessage } from './sameboy-worker-protocol.js';

describe('SameBoy worker audio messages', () => {
  it('carries normalized stereo PCM at the fixed core sample rate', () => {
    const message: SameBoyWorkerMessage = {
      channels: 2,
      sampleRate: 48000,
      samples: new Float32Array([0, 0.25, -0.5, 1]),
      type: 'audio',
    };

    expect(message.samples).toEqual(new Float32Array([0, 0.25, -0.5, 1]));
  });
});
