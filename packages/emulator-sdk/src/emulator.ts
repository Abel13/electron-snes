import { PluginManifestSchema } from '@platform/plugin-sdk';
import type { PluginManifest } from '@platform/plugin-sdk';

export type EmulatorSessionStatus =
  'failed' | 'idle' | 'paused' | 'running' | 'starting' | 'stopped' | 'stopping';

export interface EmulatorCapabilities {
  readonly fastForward: boolean;
  readonly rewind: boolean;
  readonly saveStates: boolean;
}

export interface EmulatorRom {
  readonly bytes: Uint8Array;
  readonly extension: string;
  readonly name: string;
}

export interface EmulatorInput {
  readonly actions: readonly string[];
  readonly playerPortId: string;
}

export interface EmulatorVideoFrame {
  readonly height: number;
  readonly pixels: Uint8Array;
  readonly pixelFormat: 'rgba8888';
  readonly width: number;
}

export interface EmulatorAudioFrame {
  readonly channels: 1 | 2;
  readonly sampleRate: number;
  readonly samples: Float32Array;
}

export interface EmulatorCartridgeSave {
  readonly bytes: Uint8Array;
}

export interface EmulatorSaveState {
  readonly bytes: Uint8Array;
  readonly coreId: string;
  readonly formatVersion: number;
}

export interface EmulatorOperationSuccess {
  readonly status: 'ok';
}

export interface EmulatorOperationFailure {
  readonly code: 'invalid-rom' | 'invalid-state' | 'unavailable' | 'unexpected';
  readonly message: string;
  readonly status: 'error';
}

export type EmulatorOperationResult = EmulatorOperationFailure | EmulatorOperationSuccess;

export interface EmulatorSaveStateSuccess extends EmulatorOperationSuccess {
  readonly saveState: EmulatorSaveState;
}

export type EmulatorSaveStateResult = EmulatorOperationFailure | EmulatorSaveStateSuccess;

export interface EmulatorStopSuccess extends EmulatorOperationSuccess {
  readonly cartridgeSave?: EmulatorCartridgeSave;
}

export type EmulatorStopResult = EmulatorOperationFailure | EmulatorStopSuccess;

export type UnsubscribeEmulatorOutput = () => void;

export interface EmulatorSession {
  captureSaveState?(): Promise<EmulatorSaveStateResult>;
  getStatus(): EmulatorSessionStatus;
  loadRom(
    rom: EmulatorRom,
    cartridgeSave?: EmulatorCartridgeSave,
  ): Promise<EmulatorOperationResult>;
  pause(): Promise<EmulatorOperationResult>;
  resume(): Promise<EmulatorOperationResult>;
  restoreSaveState?(saveState: EmulatorSaveState): Promise<EmulatorOperationResult>;
  setFastForwardActive?(active: boolean): Promise<EmulatorOperationResult>;
  setRewindActive?(active: boolean): Promise<EmulatorOperationResult>;
  setInput(input: EmulatorInput): Promise<EmulatorOperationResult>;
  start(): Promise<EmulatorOperationResult>;
  stop(): Promise<EmulatorStopResult>;
  subscribeAudio(listener: (frame: EmulatorAudioFrame) => void): UnsubscribeEmulatorOutput;
  subscribeCartridgeSave(
    listener: (save: EmulatorCartridgeSave) => void,
  ): UnsubscribeEmulatorOutput;
  subscribeVideo(listener: (frame: EmulatorVideoFrame) => void): UnsubscribeEmulatorOutput;
}

export const validateEmulatorSessionCapabilities = (
  session: EmulatorSession,
  capabilities: EmulatorCapabilities,
): EmulatorOperationResult => {
  if (
    capabilities.saveStates &&
    (typeof session.captureSaveState !== 'function' ||
      typeof session.restoreSaveState !== 'function')
  )
    return {
      code: 'unavailable',
      message: 'The emulator session does not implement its declared save-state capability.',
      status: 'error',
    };

  if (capabilities.rewind && typeof session.setRewindActive !== 'function')
    return {
      code: 'unavailable',
      message: 'The emulator session does not implement its declared rewind capability.',
      status: 'error',
    };

  if (capabilities.fastForward && typeof session.setFastForwardActive !== 'function')
    return {
      code: 'unavailable',
      message: 'The emulator session does not implement its declared fast-forward capability.',
      status: 'error',
    };

  return { status: 'ok' };
};

export interface EmulatorCoreDefinition {
  readonly capabilities: EmulatorCapabilities;
  readonly compatibleConsoleIds: readonly string[];
  readonly id: string;
  readonly supportedRomExtensions: readonly string[];
}

export interface EmulatorPluginDefinition {
  readonly createSession: () => Promise<EmulatorSession>;
  readonly emulator: EmulatorCoreDefinition;
  readonly manifest: PluginManifest;
}

export const defineEmulator = <TDefinition extends EmulatorPluginDefinition>(
  definition: TDefinition,
): TDefinition => definition;

export const validateEmulatorPlugin = (input: unknown): EmulatorOperationResult => {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return {
      code: 'invalid-rom',
      message: 'An emulator plugin definition must be an object.',
      status: 'error',
    };
  }

  const candidate = input as Record<string, unknown>;
  const manifest = PluginManifestSchema.safeParse(candidate['manifest']);

  if (!manifest.success || manifest.data.type !== 'emulator-core') {
    return {
      code: 'unavailable',
      message: 'An emulator plugin definition must use a valid emulator-core manifest.',
      status: 'error',
    };
  }

  const emulator = candidate['emulator'];

  if (typeof emulator !== 'object' || emulator === null || Array.isArray(emulator)) {
    return { code: 'unavailable', message: 'An emulator definition is required.', status: 'error' };
  }

  const definition = emulator as Record<string, unknown>;
  const extensions = definition['supportedRomExtensions'];
  const consoles = definition['compatibleConsoleIds'];
  const capabilities = definition['capabilities'];

  if (
    definition['id'] !== manifest.data.id ||
    !Array.isArray(extensions) ||
    extensions.length === 0 ||
    !extensions.every(
      (extension) => typeof extension === 'string' && /^\.[a-z0-9]+$/.test(extension),
    ) ||
    !Array.isArray(consoles) ||
    consoles.length === 0 ||
    !consoles.every((id) => typeof id === 'string') ||
    typeof capabilities !== 'object' ||
    capabilities === null ||
    Array.isArray(capabilities) ||
    typeof (capabilities as Record<string, unknown>)['fastForward'] !== 'boolean' ||
    typeof (capabilities as Record<string, unknown>)['rewind'] !== 'boolean' ||
    typeof (capabilities as Record<string, unknown>)['saveStates'] !== 'boolean' ||
    typeof candidate['createSession'] !== 'function'
  ) {
    return { code: 'unavailable', message: 'The emulator definition is invalid.', status: 'error' };
  }

  return { status: 'ok' };
};
