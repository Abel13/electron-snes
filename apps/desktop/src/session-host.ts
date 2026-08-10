import { EmulatorSessionController } from '@platform/emulator';
import type { EmulatorOperationResult, EmulatorPluginDefinition } from '@platform/emulator-sdk';

import type { LoadedRom, SessionCommandResponse } from './ipc.js';

export interface DesktopSessionHost {
  launch(rom: LoadedRom): Promise<SessionCommandResponse>;
  pause(): Promise<SessionCommandResponse>;
  resume(): Promise<SessionCommandResponse>;
  setInput(playerPortId: string, actions: readonly string[]): Promise<SessionCommandResponse>;
  stop(): Promise<SessionCommandResponse>;
}

export interface DesktopSessionHostOutputs {
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
  const controller = new EmulatorSessionController(plugin, {
    onAudio: outputs.sendAudio,
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
    launch: async (rom) => execute(() => controller.launch(rom)),
    pause: async () => execute(() => controller.pause()),
    resume: async () => execute(() => controller.resume()),
    setInput: async (playerPortId, actions) =>
      execute(() => controller.setInput({ actions, playerPortId })),
    stop: async () => execute(() => controller.stop()),
  };
};
