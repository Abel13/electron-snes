import type {
  EmulatorInput,
  EmulatorOperationResult,
  EmulatorRom,
  EmulatorSessionStatus,
} from '@platform/emulator-sdk';

export type SameBoyWorkerRequest =
  | { readonly id: string; readonly rom: EmulatorRom; readonly type: 'load-rom' }
  | { readonly id: string; readonly type: 'pause' | 'resume' | 'start' | 'stop' }
  | { readonly id: string; readonly input: EmulatorInput; readonly type: 'set-input' };

export type SameBoyWorkerCommand =
  | { readonly rom: EmulatorRom; readonly type: 'load-rom' }
  | { readonly type: 'pause' | 'resume' | 'start' | 'stop' }
  | { readonly input: EmulatorInput; readonly type: 'set-input' };

export type SameBoyWorkerMessage =
  | {
      readonly channels: 2;
      readonly sampleRate: 48000;
      readonly samples: Float32Array;
      readonly type: 'audio';
    }
  | {
      readonly id: string;
      readonly result: EmulatorOperationResult;
      readonly status: EmulatorSessionStatus;
      readonly type: 'result';
    }
  | {
      readonly height: 144;
      readonly pixels: Uint8Array;
      readonly type: 'video';
      readonly width: 160;
    };
