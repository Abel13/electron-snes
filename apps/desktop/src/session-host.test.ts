import { describe, expect, it } from 'vitest';
import type {
  EmulatorPluginDefinition,
  EmulatorSession,
  EmulatorSessionStatus,
} from '@platform/emulator-sdk';

import { createDesktopSessionHost } from './session-host.js';

const inputSnapshots: (readonly string[])[] = [];

const createPlugin = (): EmulatorPluginDefinition => {
  let status: EmulatorSessionStatus = 'idle';
  let audio:
    ((frame: { channels: 2; sampleRate: number; samples: Float32Array }) => void) | undefined;
  let video:
    | ((frame: {
        height: number;
        pixelFormat: 'rgba8888';
        pixels: Uint8Array;
        width: number;
      }) => void)
    | undefined;
  const session: EmulatorSession = {
    getStatus: () => status,
    loadRom: async () => ({ status: 'ok' }),
    pause: async () => ((status = 'paused'), { status: 'ok' }),
    resume: async () => ((status = 'running'), { status: 'ok' }),
    setInput: async (input) => (inputSnapshots.push(input.actions), { status: 'ok' }),
    start: async () => {
      status = 'running';
      video?.({
        height: 144,
        pixelFormat: 'rgba8888',
        pixels: new Uint8Array(160 * 144 * 4),
        width: 160,
      });
      audio?.({ channels: 2, sampleRate: 48000, samples: new Float32Array([0, 0]) });
      return { status: 'ok' };
    },
    stop: async () => ((status = 'stopped'), { status: 'ok' }),
    subscribeAudio: (listener) => ((audio = listener), () => (audio = undefined)),
    subscribeVideo: (listener) => ((video = listener), () => (video = undefined)),
  };
  return {
    createSession: async () => session,
    emulator: {
      capabilities: { fastForward: false, rewind: false, saveStates: false },
      compatibleConsoleIds: ['org.pixelcore.game-boy-family'],
      id: 'org.pixelcore.fixture',
      supportedRomExtensions: ['.gb', '.gbc'],
    },
    manifest: {
      apiVersion: 1,
      capabilities: ['audio-output', 'video-output'],
      id: 'org.pixelcore.fixture',
      name: 'Fixture',
      permissions: [],
      type: 'emulator-core',
      version: '1.0.0',
    },
  };
};

describe('DesktopSessionHost', () => {
  it('forwards renderer-safe frames and lifecycle outcomes', async () => {
    const audio: Float32Array[] = [];
    const video: Uint8Array[] = [];
    const host = createDesktopSessionHost(createPlugin(), {
      sendAudio: (frame) => audio.push(frame.samples),
      sendVideo: (frame) => video.push(frame.pixels),
    });

    await expect(
      host.launch({
        bytes: new Uint8Array([1]),
        extension: '.gbc',
        name: 'fixture.gbc',
        selectionId: 'opaque-id',
      }),
    ).resolves.toEqual({ sessionStatus: 'running', status: 'ok' });
    await expect(host.pause()).resolves.toEqual({ sessionStatus: 'paused', status: 'ok' });
    await expect(host.resume()).resolves.toEqual({ sessionStatus: 'running', status: 'ok' });
    await expect(host.setInput('player-one', ['up', 'a'])).resolves.toEqual({
      sessionStatus: 'running',
      status: 'ok',
    });
    expect(inputSnapshots.at(-1)).toEqual(['up', 'a']);
    await expect(host.stop()).resolves.toEqual({ sessionStatus: 'stopped', status: 'ok' });
    expect(audio).toHaveLength(1);
    expect(video).toHaveLength(1);
  });
});
