import { describe, expect, it } from 'vitest';
import { vi } from 'vitest';
import type {
  EmulatorPluginDefinition,
  EmulatorSession,
  EmulatorSessionStatus,
} from '@platform/emulator-sdk';

import { createDesktopSessionHost } from './session-host.js';

const inputSnapshots: (readonly string[])[] = [];

const createPlugin = (saveStates = false): EmulatorPluginDefinition => {
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
    subscribeCartridgeSave: () => () => undefined,
    subscribeVideo: (listener) => ((video = listener), () => (video = undefined)),
  };
  return {
    createSession: async () => session,
    emulator: {
      capabilities: { fastForward: false, rewind: false, saveStates },
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
      loadCartridgeSave: async () => undefined,
      persistCartridgeSave: async () => undefined,
      sendAudio: (frame) => audio.push(frame.samples),
      sendVideo: (frame) => video.push(frame.pixels),
    });

    await expect(
      host.launch(
        {
          bytes: new Uint8Array([1]),
          extension: '.gbc',
          name: 'fixture.gbc',
          selectionId: 'opaque-id',
        },
        'a'.repeat(64),
      ),
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

  it('loads and persists cartridge data using an opaque ROM identity', async () => {
    const key = 'b'.repeat(64);
    const restored = new Uint8Array([9, 8, 7]);
    const persisted: Uint8Array[] = [];
    const plugin = createPlugin();
    const session = await plugin.createSession();
    const originalStop = session.stop;
    session.stop = async () => ({ cartridgeSave: { bytes: new Uint8Array([6, 5]) }, status: 'ok' });
    const host = createDesktopSessionHost(plugin, {
      loadCartridgeSave: async (saveKey) => (saveKey === key ? restored : undefined),
      persistCartridgeSave: async (_saveKey, bytes) => {
        persisted.push(bytes);
      },
      sendAudio: () => undefined,
      sendVideo: () => undefined,
    });

    await host.launch(
      { bytes: new Uint8Array([1]), extension: '.gb', name: 'save.gb', selectionId: 'id' },
      key,
    );
    await host.stop();

    expect(persisted).toEqual([new Uint8Array([6, 5])]);
    session.stop = originalStop;
  });

  it('captures autosaves periodically and before a clean stop', async () => {
    vi.useFakeTimers();
    const plugin = createPlugin(true);
    const session = await plugin.createSession();
    session.captureSaveState = async () => ({
      saveState: {
        bytes: new Uint8Array([7]),
        coreId: 'org.pixelcore.fixture',
        formatVersion: 1,
      },
      status: 'ok',
    });
    const writes: string[] = [];
    const host = createDesktopSessionHost(plugin, {
      loadCartridgeSave: async () => undefined,
      persistCartridgeSave: async () => undefined,
      sendAudio: () => undefined,
      sendVideo: () => undefined,
      writeSaveState: async (_gameId, slot) => {
        writes.push(slot);
      },
    });
    await host.launch(
      { bytes: new Uint8Array([1]), extension: '.gb', name: 'auto.gb', selectionId: 'id' },
      'save-key',
      'game-1',
      true,
    );
    await vi.advanceTimersByTimeAsync(300_000);
    await host.stop();
    expect(writes).toEqual(['autosave', 'autosave']);
    vi.useRealTimers();
  });

  it('restores an explicitly selected autosave after launch', async () => {
    const plugin = createPlugin(true);
    const session = await plugin.createSession();
    const restored = vi.fn(async () => ({ status: 'ok' as const }));
    session.captureSaveState = async () => ({
      saveState: { bytes: new Uint8Array([1]), coreId: plugin.emulator.id, formatVersion: 1 },
      status: 'ok',
    });
    session.restoreSaveState = restored;
    const state = { bytes: new Uint8Array([7]), coreId: plugin.emulator.id, formatVersion: 1 };
    const host = createDesktopSessionHost(plugin, {
      loadCartridgeSave: async () => undefined,
      persistCartridgeSave: async () => undefined,
      sendAudio: () => undefined,
      sendVideo: () => undefined,
    });
    await expect(
      host.launch(
        { bytes: new Uint8Array([1]), extension: '.gb', name: 'auto.gb', selectionId: 'id' },
        'save-key',
        'game-1',
        true,
        state,
      ),
    ).resolves.toMatchObject({ status: 'ok' });
    expect(restored).toHaveBeenCalledWith(state);
    await host.stop();
  });

  it('checkpoints wall-clock playtime across pauses and flushes on stop', async () => {
    vi.useFakeTimers();
    let now = 0;
    const checkpoints: number[] = [];
    const host = createDesktopSessionHost(createPlugin(false), {
      loadCartridgeSave: async () => undefined,
      monotonicNow: () => now,
      persistCartridgeSave: async () => undefined,
      persistPlaytime: async (_gameId, elapsedMilliseconds) => {
        checkpoints.push(elapsedMilliseconds);
      },
      sendAudio: () => undefined,
      sendVideo: () => undefined,
    });
    await host.launch(
      {
        bytes: new Uint8Array([1]),
        extension: '.gbc',
        name: 'fixture.gbc',
        selectionId: 'opaque-id',
      },
      'save-key',
      'game-1',
    );
    now = 60_000;
    await vi.advanceTimersByTimeAsync(60_000);
    await host.pause();
    now = 90_000;
    await host.stop();

    expect(checkpoints).toEqual([60_000, 30_000]);
    vi.useRealTimers();
  });
});
