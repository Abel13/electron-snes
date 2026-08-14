import type {
  EmulatorInput,
  EmulatorCartridgeSave,
  EmulatorOperationResult,
  EmulatorRom,
  EmulatorSaveState,
  EmulatorSessionStatus,
} from '@platform/emulator-sdk';

export type MgbaWorkerRequest =
  | {
      readonly cartridgeSave?: EmulatorCartridgeSave;
      readonly id: string;
      readonly rom: EmulatorRom;
      readonly type: 'load-rom';
    }
  | { readonly id: string; readonly type: 'pause' | 'resume' | 'start' | 'stop' }
  | { readonly id: string; readonly type: 'capture-save-state' }
  | { readonly active: boolean; readonly id: string; readonly type: 'set-fast-forward-active' }
  | { readonly active: boolean; readonly id: string; readonly type: 'set-rewind-active' }
  | {
      readonly id: string;
      readonly saveState: EmulatorSaveState;
      readonly type: 'restore-save-state';
    }
  | { readonly id: string; readonly input: EmulatorInput; readonly type: 'set-input' };

export type MgbaWorkerCommand =
  | {
      readonly cartridgeSave?: EmulatorCartridgeSave;
      readonly rom: EmulatorRom;
      readonly type: 'load-rom';
    }
  | { readonly type: 'pause' | 'resume' | 'start' | 'stop' }
  | { readonly type: 'capture-save-state' }
  | { readonly active: boolean; readonly type: 'set-fast-forward-active' }
  | { readonly active: boolean; readonly type: 'set-rewind-active' }
  | { readonly saveState: EmulatorSaveState; readonly type: 'restore-save-state' }
  | { readonly input: EmulatorInput; readonly type: 'set-input' };

export type MgbaWorkerMessage =
  | {
      readonly save: EmulatorCartridgeSave;
      readonly type: 'cartridge-save';
    }
  | {
      readonly channels: 2;
      readonly sampleRate: number;
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
      readonly height: number;
      readonly pixels: Uint8Array;
      readonly type: 'video';
      readonly width: number;
    };
