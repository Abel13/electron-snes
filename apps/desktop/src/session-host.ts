import { EmulatorSessionController } from '@platform/emulator';
import type { SaveStateDescriptor, SaveStateSlot } from '@platform/emulator';
import type { EmulatorOperationResult, EmulatorPluginDefinition } from '@platform/emulator-sdk';

import type { LoadedRom, SessionCommandResponse } from './ipc.js';

export interface DesktopSessionHost {
  captureSaveState(slot: SaveStateSlot): Promise<SessionCommandResponse>;
  launch(
    rom: LoadedRom,
    saveKey: string,
    gameId?: string,
    autosaveEnabled?: boolean,
  ): Promise<SessionCommandResponse>;
  listSaveStates(): Promise<SaveStateListResponse>;
  pause(): Promise<SessionCommandResponse>;
  resume(): Promise<SessionCommandResponse>;
  restoreSaveState(slot: SaveStateSlot): Promise<SessionCommandResponse>;
  setRewindActive(active: boolean): Promise<SessionCommandResponse>;
  setInput(playerPortId: string, actions: readonly string[]): Promise<SessionCommandResponse>;
  stop(): Promise<SessionCommandResponse>;
}

export interface DesktopSessionHostOutputs {
  readonly listSaveStates?: (gameId: string) => Promise<readonly SaveStateDescriptor[]>;
  readonly loadCartridgeSave: (key: string) => Promise<Uint8Array | undefined>;
  readonly persistCartridgeSave: (key: string, bytes: Uint8Array) => Promise<void>;
  readonly readSaveState?: (
    gameId: string,
    slot: SaveStateSlot,
  ) => Promise<import('@platform/emulator-sdk').EmulatorSaveState | undefined>;
  readonly sendAudio: (frame: {
    channels: 1 | 2;
    sampleRate: number;
    samples: Float32Array;
  }) => void;
  readonly sendVideo: (frame: { height: number; pixels: Uint8Array; width: number }) => void;
  readonly writeSaveState?: (
    gameId: string,
    slot: SaveStateSlot,
    state: import('@platform/emulator-sdk').EmulatorSaveState,
  ) => Promise<void>;
}

export type SaveStateListResponse =
  | {
      readonly capability: true;
      readonly slots: readonly SaveStateDescriptor[];
      readonly status: 'ok';
    }
  | {
      readonly code: 'invalid-state' | 'unavailable' | 'unexpected';
      readonly message: string;
      readonly status: 'error';
    };

export const createDesktopSessionHost = (
  plugin: EmulatorPluginDefinition,
  outputs: DesktopSessionHostOutputs,
): DesktopSessionHost => {
  let activeSaveKey: string | undefined;
  let activeGameId: string | undefined;
  let autosaveTimer: ReturnType<typeof setInterval> | undefined;
  const controller = new EmulatorSessionController(plugin, {
    onAudio: outputs.sendAudio,
    onCartridgeSave: async (save) => {
      if (activeSaveKey !== undefined)
        await outputs.persistCartridgeSave(activeSaveKey, save.bytes);
    },
    onVideo: (frame) => outputs.sendVideo(frame),
  });

  const execute = async (
    operation: () => Promise<EmulatorOperationResult>,
  ): Promise<SessionCommandResponse> => {
    const result = await operation();
    return result.status === 'ok'
      ? { sessionStatus: controller.getStatus(), status: 'ok' }
      : { code: result.code, message: result.message, status: 'error' };
  };

  const clearAutosaveTimer = (): void => {
    if (autosaveTimer !== undefined) clearInterval(autosaveTimer);
    autosaveTimer = undefined;
  };

  const captureAutosave = async (): Promise<void> => {
    if (activeGameId === undefined || outputs.writeSaveState === undefined) return;
    const captured = await controller.captureSaveState();
    if (captured.status === 'ok')
      await outputs.writeSaveState(activeGameId, 'autosave', captured.saveState);
  };

  return {
    captureSaveState: async (slot) => {
      if (activeGameId === undefined || outputs.writeSaveState === undefined)
        return {
          code: 'invalid-state',
          message: 'An active library game is required.',
          status: 'error',
        };
      const captured = await controller.captureSaveState();
      if (captured.status === 'error') return captured;
      try {
        await outputs.writeSaveState(activeGameId, slot, captured.saveState);
        return { sessionStatus: controller.getStatus(), status: 'ok' };
      } catch {
        return {
          code: 'unexpected',
          message: 'The save state could not be stored.',
          status: 'error',
        };
      }
    },
    launch: async (rom, saveKey, gameId = saveKey, autosaveEnabled = false) => {
      try {
        const bytes = await outputs.loadCartridgeSave(saveKey);
        activeSaveKey = saveKey;
        activeGameId = gameId;
        const result = await execute(() =>
          controller.launch(rom, bytes === undefined ? undefined : { bytes }),
        );
        if (result.status === 'error') {
          clearAutosaveTimer();
          activeSaveKey = undefined;
          activeGameId = undefined;
        }
        if (result.status === 'ok' && autosaveEnabled) {
          autosaveTimer = setInterval(() => void captureAutosave().catch(() => undefined), 300_000);
          autosaveTimer.unref?.();
        }
        return result;
      } catch {
        clearAutosaveTimer();
        activeSaveKey = undefined;
        activeGameId = undefined;
        return {
          code: 'unavailable',
          message: 'The cartridge save could not be loaded.',
          status: 'error',
        };
      }
    },
    listSaveStates: async () => {
      if (activeGameId === undefined || outputs.listSaveStates === undefined)
        return {
          code: 'invalid-state',
          message: 'An active library game is required.',
          status: 'error',
        };
      try {
        return {
          capability: true,
          slots: await outputs.listSaveStates(activeGameId),
          status: 'ok',
        };
      } catch {
        return { code: 'unexpected', message: 'Save states could not be listed.', status: 'error' };
      }
    },
    pause: async () => execute(() => controller.pause()),
    resume: async () => execute(() => controller.resume()),
    restoreSaveState: async (slot) => {
      if (activeGameId === undefined || outputs.readSaveState === undefined)
        return {
          code: 'invalid-state',
          message: 'An active library game is required.',
          status: 'error',
        };
      try {
        const state = await outputs.readSaveState(activeGameId, slot);
        if (state === undefined)
          return {
            code: 'invalid-state',
            message: 'The selected save-state slot is empty.',
            status: 'error',
          };
        return execute(() => controller.restoreSaveState(state));
      } catch {
        return {
          code: 'unexpected',
          message: 'The save state could not be loaded.',
          status: 'error',
        };
      }
    },
    setInput: async (playerPortId, actions) =>
      execute(() => controller.setInput({ actions, playerPortId })),
    setRewindActive: async (active) => execute(() => controller.setRewindActive(active)),
    stop: async () => {
      clearAutosaveTimer();
      await captureAutosave().catch(() => undefined);
      const result = await execute(() => controller.stop());
      if (result.status === 'ok') {
        activeSaveKey = undefined;
        activeGameId = undefined;
      }
      return result;
    },
  };
};
