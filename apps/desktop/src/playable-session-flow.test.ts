import { describe, expect, it } from 'vitest';
import { EmulatorSessionController } from '@platform/emulator';
import type {
  EmulatorInput,
  EmulatorPluginDefinition,
  EmulatorSession,
  EmulatorSessionStatus,
} from '@platform/emulator-sdk';

import { loadSelectedRom } from './rom-loader.js';
import { createRomSelectionStore } from './rom-selection.js';

const fixtureBytes = new Uint8Array([0x50, 0x43, 0x47, 0x42]);

const createFixturePlugin = (observedInputs: EmulatorInput[]): EmulatorPluginDefinition => {
  let status: EmulatorSessionStatus = 'idle';
  let audioListener:
    ((frame: { channels: 2; sampleRate: 48000; samples: Float32Array }) => void) | undefined;
  let videoListener:
    | ((frame: { height: 144; pixelFormat: 'rgba8888'; pixels: Uint8Array; width: 160 }) => void)
    | undefined;
  const session: EmulatorSession = {
    getStatus: () => status,
    loadRom: async () => ({ status: 'ok' }),
    pause: async () => ((status = 'paused'), { status: 'ok' }),
    resume: async () => ((status = 'running'), { status: 'ok' }),
    setInput: async (input) => (observedInputs.push(input), { status: 'ok' }),
    start: async () => {
      status = 'running';
      videoListener?.({
        height: 144,
        pixelFormat: 'rgba8888',
        pixels: new Uint8Array(160 * 144 * 4),
        width: 160,
      });
      audioListener?.({ channels: 2, sampleRate: 48000, samples: new Float32Array([0, 0]) });
      return { status: 'ok' };
    },
    stop: async () => ((status = 'stopped'), { status: 'ok' }),
    subscribeAudio: (listener) => {
      audioListener = listener;
      return () => (audioListener = undefined);
    },
    subscribeCartridgeSave: () => () => undefined,
    subscribeVideo: (listener) => {
      videoListener = listener;
      return () => (videoListener = undefined);
    },
  };

  return {
    createSession: async () => session,
    emulator: {
      capabilities: { fastForward: false, rewind: false, saveStates: false },
      compatibleConsoleIds: ['org.pixelcore.game-boy-family'],
      id: 'org.pixelcore.playable-session-fixture',
      supportedRomExtensions: ['.gb', '.gbc'],
    },
    manifest: {
      apiVersion: 1,
      capabilities: ['audio-output', 'video-output'],
      id: 'org.pixelcore.playable-session-fixture',
      name: 'Playable Session Fixture',
      permissions: [],
      type: 'emulator-core',
      version: '1.0.0',
    },
  };
};

describe('playable session flow', () => {
  it.each(['.gb', '.gbc'] as const)(
    'selects, loads, launches, controls, and stops a local %s ROM',
    async (extension) => {
      const selections = createRomSelectionStore();
      const selection = selections.register(`/library/homebrew${extension}`);
      const loaded = await loadSelectedRom(
        selection?.id ?? '',
        selections,
        async () => fixtureBytes,
      );
      if (loaded.status !== 'loaded') throw new Error('The redistributable fixture should load.');

      const inputs: EmulatorInput[] = [];
      const video = [] as Uint8Array[];
      const audio = [] as Float32Array[];
      const controller = new EmulatorSessionController(createFixturePlugin(inputs), {
        onAudio: (frame) => audio.push(frame.samples),
        onVideo: (frame) => video.push(frame.pixels),
      });

      await expect(controller.launch(loaded.rom)).resolves.toEqual({ status: 'ok' });
      await expect(
        controller.setInput?.({ actions: ['primary'], playerPortId: 'player-one' }),
      ).resolves.toEqual({ status: 'ok' });
      await expect(controller.pause()).resolves.toEqual({ status: 'ok' });
      await expect(controller.resume()).resolves.toEqual({ status: 'ok' });
      await expect(controller.stop()).resolves.toEqual({ status: 'ok' });

      expect(video).toHaveLength(1);
      expect(audio).toHaveLength(1);
      expect(inputs).toEqual([{ actions: ['primary'], playerPortId: 'player-one' }]);
      expect(controller.getStatus()).toBe('stopped');
    },
  );

  it('rejects unsupported files before a session can begin', async () => {
    const selections = createRomSelectionStore();

    expect(selections.register('/library/not-a-rom.zip')).toBeUndefined();
    await expect(
      loadSelectedRom('missing', selections, async () => fixtureBytes),
    ).resolves.toMatchObject({
      code: 'unavailable',
      status: 'error',
    });
  });
});
