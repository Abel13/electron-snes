import { describe, expect, it, vi } from 'vitest';
import type {
  EmulatorPluginDefinition,
  EmulatorSession,
  EmulatorSessionStatus,
} from '@platform/emulator-sdk';

import { EmulatorSessionController } from './session-lifecycle.js';

const createSession = (): EmulatorSession => ({
  getStatus: vi.fn((): EmulatorSessionStatus => 'running'),
  loadRom: vi.fn(async () => ({ status: 'ok' as const })),
  pause: vi.fn(async () => ({ status: 'ok' as const })),
  resume: vi.fn(async () => ({ status: 'ok' as const })),
  setInput: vi.fn(async () => ({ status: 'ok' as const })),
  start: vi.fn(async () => ({ status: 'ok' as const })),
  stop: vi.fn(async () => ({ status: 'ok' as const })),
  subscribeAudio: vi.fn(() => () => undefined),
  subscribeCartridgeSave: vi.fn(() => () => undefined),
  subscribeVideo: vi.fn(() => () => undefined),
});

const createPlugin = (session: EmulatorSession): EmulatorPluginDefinition => ({
  createSession: async () => session,
  emulator: {
    capabilities: { fastForward: false, rewind: false, saveStates: false },
    compatibleConsoleIds: ['org.pixelcore.game-boy-family'],
    id: 'org.pixelcore.test-emulator',
    supportedRomExtensions: ['.gb', '.gbc'],
  },
  manifest: {
    apiVersion: 1,
    capabilities: ['test-output'],
    id: 'org.pixelcore.test-emulator',
    name: 'Test Emulator',
    permissions: [],
    type: 'emulator-core',
    version: '1.0.0',
  },
});

const rom = { bytes: new Uint8Array([1]), extension: '.gb', name: 'test.gb' };

describe('EmulatorSessionController', () => {
  it('launches, pauses, resumes, and stops an injected session', async () => {
    const session = createSession();
    const controller = new EmulatorSessionController(createPlugin(session));

    await expect(controller.launch(rom)).resolves.toEqual({ status: 'ok' });
    await expect(controller.pause()).resolves.toEqual({ status: 'ok' });
    await expect(controller.resume()).resolves.toEqual({ status: 'ok' });
    await expect(controller.stop()).resolves.toEqual({ status: 'ok' });

    expect(session.loadRom).toHaveBeenCalledWith(rom, undefined);
    expect(session.start).toHaveBeenCalledOnce();
    expect(controller.getStatus()).toBe('stopped');
  });

  it('restores and flushes cartridge saves around the session lifecycle', async () => {
    const session = createSession();
    const restored = { bytes: new Uint8Array([1, 2]) };
    const flushed = { bytes: new Uint8Array([3, 4]) };
    vi.mocked(session.stop).mockResolvedValue({ cartridgeSave: flushed, status: 'ok' });
    const persisted: Uint8Array[] = [];
    const controller = new EmulatorSessionController(createPlugin(session), {
      onCartridgeSave: (save) => {
        persisted.push(save.bytes);
      },
    });

    await controller.launch(rom, restored);
    await expect(controller.stop()).resolves.toEqual({ cartridgeSave: flushed, status: 'ok' });

    expect(session.loadRom).toHaveBeenCalledWith(rom, restored);
    expect(persisted).toEqual([flushed.bytes]);
  });

  it('stops and clears a session when ROM loading fails', async () => {
    const session = createSession();
    vi.mocked(session.loadRom).mockResolvedValue({
      code: 'invalid-rom',
      message: 'Invalid ROM.',
      status: 'error',
    });
    const controller = new EmulatorSessionController(createPlugin(session));

    await expect(controller.launch(rom)).resolves.toMatchObject({ code: 'invalid-rom' });

    expect(session.start).not.toHaveBeenCalled();
    expect(session.stop).toHaveBeenCalledOnce();
    await expect(controller.launch(rom)).resolves.toMatchObject({ code: 'invalid-rom' });
  });

  it('does not allow a second active session', async () => {
    const session = createSession();
    const controller = new EmulatorSessionController(createPlugin(session));

    await controller.launch(rom);

    await expect(controller.launch(rom)).resolves.toMatchObject({ code: 'invalid-state' });
  });

  it('forwards normalized input only to an active session', async () => {
    const session = createSession();
    const controller = new EmulatorSessionController(createPlugin(session));
    const input = { actions: ['primary'], playerPortId: 'player-one' };

    await expect(controller.setInput(input)).resolves.toMatchObject({ code: 'invalid-state' });
    await controller.launch(rom);
    await expect(controller.setInput(input)).resolves.toEqual({ status: 'ok' });

    expect(session.setInput).toHaveBeenCalledWith(input);
  });

  it('gates save-state operations through the declared capability', async () => {
    const session = createSession();
    const controller = new EmulatorSessionController(createPlugin(session));
    await controller.launch(rom);
    await expect(controller.captureSaveState()).resolves.toMatchObject({ code: 'unavailable' });
    await expect(
      controller.restoreSaveState({
        bytes: new Uint8Array([1]),
        coreId: 'org.pixelcore.test-emulator',
        formatVersion: 1,
      }),
    ).resolves.toMatchObject({ code: 'unavailable' });
  });

  it('does not invoke rewind unless the active plugin declares it', async () => {
    const session = createSession();
    session.setRewindActive = vi.fn(async () => ({ status: 'ok' as const }));
    const controller = new EmulatorSessionController(createPlugin(session));
    await controller.launch(rom);
    await expect(controller.setRewindActive(true)).resolves.toMatchObject({ code: 'unavailable' });
    expect(session.setRewindActive).not.toHaveBeenCalled();
  });

  it('does not invoke fast-forward unless the active plugin declares it', async () => {
    const session = createSession();
    session.setFastForwardActive = vi.fn(async () => ({ status: 'ok' as const }));
    const controller = new EmulatorSessionController(createPlugin(session));
    await controller.launch(rom);
    await expect(controller.setFastForwardActive(true)).resolves.toMatchObject({
      code: 'unavailable',
    });
    expect(session.setFastForwardActive).not.toHaveBeenCalled();
  });
});
