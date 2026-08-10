import { EmulatorSessionController } from '@platform/emulator';
import type { EmulatorOperationResult, EmulatorPluginDefinition } from '@platform/emulator-sdk';

import type { LoadedRom, SessionCommandResponse } from './ipc.js';

export interface DesktopSessionHost {
  launch(rom: LoadedRom, saveKey: string): Promise<SessionCommandResponse>;
  pause(): Promise<SessionCommandResponse>;
  resume(): Promise<SessionCommandResponse>;
  setInput(playerPortId: string, actions: readonly string[]): Promise<SessionCommandResponse>;
  stop(): Promise<SessionCommandResponse>;
}

export interface DesktopSessionHostOutputs {
  readonly loadCartridgeSave: (key: string) => Promise<Uint8Array | undefined>;
  readonly persistCartridgeSave: (key: string, bytes: Uint8Array) => Promise<void>;
  readonly sendAudio: (frame: {
    channels: 1 | 2;
    sampleRate: number;
    samples: Float32Array;
  }) => void;
  readonly sendVideo: (frame: { height: number; pixels: Uint8Array; width: number }) => void;
}

export const createDesktopSessionHost = (
  plugin: EmulatorPluginDefinition,
  outputs: DesktopSessionHostOutputs,
): DesktopSessionHost => {
  let activeSaveKey: string | undefined;
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

  return {
    launch: async (rom, saveKey) => {
      try {
        const bytes = await outputs.loadCartridgeSave(saveKey);
        activeSaveKey = saveKey;
        const result = await execute(() =>
          controller.launch(rom, bytes === undefined ? undefined : { bytes }),
        );
        if (result.status === 'error') activeSaveKey = undefined;
        return result;
      } catch {
        activeSaveKey = undefined;
        return {
          code: 'unavailable',
          message: 'The cartridge save could not be loaded.',
          status: 'error',
        };
      }
    },
    pause: async () => execute(() => controller.pause()),
    resume: async () => execute(() => controller.resume()),
    setInput: async (playerPortId, actions) =>
      execute(() => controller.setInput({ actions, playerPortId })),
    stop: async () => {
      const result = await execute(() => controller.stop());
      if (result.status === 'ok') activeSaveKey = undefined;
      return result;
    },
  };
};
