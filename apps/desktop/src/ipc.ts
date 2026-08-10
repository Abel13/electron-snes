import type { ConsoleInputMapping, InputProfile } from '@platform/input';
import { validateConsoleInputMapping, validateInputProfile } from '@platform/input';

export const IPC_CHANNELS = {
  getInputConfiguration: 'pixel-core:get-input-configuration',
  getHostVersion: 'pixel-core:host-version',
  loadRom: 'pixel-core:load-rom',
  pauseSession: 'pixel-core:pause-session',
  resumeSession: 'pixel-core:resume-session',
  saveInputProfile: 'pixel-core:save-input-profile',
  selectRom: 'pixel-core:select-rom',
  setSessionInput: 'pixel-core:set-session-input',
  startSession: 'pixel-core:start-session',
  stopSession: 'pixel-core:stop-session',
} as const;

export const SESSION_EVENT_CHANNELS = {
  audio: 'pixel-core:session-audio',
  video: 'pixel-core:session-video',
} as const;

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];

export interface HostVersionResponse {
  readonly version: string;
}

export interface SelectedRom {
  readonly extension: '.gb' | '.gbc';
  readonly id: string;
  readonly name: string;
}

export interface LoadedRom {
  readonly bytes: Uint8Array;
  readonly extension: '.gb' | '.gbc';
  readonly name: string;
  readonly selectionId: string;
}

export type SessionCommandResponse =
  | { readonly sessionStatus: string; readonly status: 'ok' }
  | {
      readonly code: 'invalid-rom' | 'invalid-state' | 'unavailable' | 'unexpected';
      readonly message: string;
      readonly status: 'error';
    };

export interface SessionAudioFrame {
  readonly channels: 1 | 2;
  readonly sampleRate: number;
  readonly samples: Float32Array;
}

interface SessionAudioEvent {
  readonly channels: 1 | 2;
  readonly sampleRate: number;
  readonly samples: ArrayBuffer;
}

export interface SessionVideoFrame {
  readonly height: number;
  readonly pixels: Uint8Array;
  readonly width: number;
}

interface SessionVideoEvent {
  readonly height: number;
  readonly pixels: ArrayBuffer;
  readonly width: number;
}

export type SelectRomResponse =
  { readonly status: 'cancelled' } | { readonly rom: SelectedRom; readonly status: 'selected' };

export type LoadRomResponse =
  | {
      readonly code: 'invalid-rom' | 'unavailable';
      readonly message: string;
      readonly status: 'error';
    }
  | { readonly rom: LoadedRom; readonly status: 'loaded' };

export interface PixelCoreApi {
  getInputConfiguration(): Promise<InputConfigurationResponse>;
  getHostVersion(): Promise<HostVersionResponse>;
  loadRom(selectionId: string): Promise<LoadRomResponse>;
  pauseSession(): Promise<SessionCommandResponse>;
  resumeSession(): Promise<SessionCommandResponse>;
  saveInputProfile(profile: InputProfile): Promise<InputProfileResponse>;
  selectRom(): Promise<SelectRomResponse>;
  setSessionInput(input: SessionInputPayload): Promise<SessionCommandResponse>;
  startSession(selectionId: string): Promise<SessionCommandResponse>;
  stopSession(): Promise<SessionCommandResponse>;
  subscribeSessionAudio(listener: (frame: SessionAudioFrame) => void): () => void;
  subscribeSessionVideo(listener: (frame: SessionVideoFrame) => void): () => void;
}

export interface SessionInputPayload {
  readonly actions: readonly string[];
  readonly playerPortId: string;
}

export interface InputConfigurationResponse {
  readonly mapping: ConsoleInputMapping;
  readonly profile?: InputProfile;
}

export type InputProfileResponse =
  | { readonly profile: InputProfile; readonly status: 'saved' }
  | { readonly message: string; readonly status: 'error' };

export type IpcInvoker = (channel: IpcChannel, ...payload: readonly unknown[]) => Promise<unknown>;
export type IpcSubscriber = (
  channel: (typeof SESSION_EVENT_CHANNELS)[keyof typeof SESSION_EVENT_CHANNELS],
  listener: (payload: unknown) => void,
) => () => void;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isArrayBuffer = (value: unknown): value is ArrayBuffer =>
  Object.prototype.toString.call(value) === '[object ArrayBuffer]';

const isSessionVideoEvent = (value: unknown): value is SessionVideoEvent =>
  isRecord(value) &&
  Object.keys(value).length === 3 &&
  typeof value['height'] === 'number' &&
  isArrayBuffer(value['pixels']) &&
  typeof value['width'] === 'number';

export const hasNoIpcPayload = (payload: readonly unknown[]): boolean => payload.length === 0;

export const hasRomSelectionIdPayload = (
  payload: readonly unknown[],
): payload is readonly [string] =>
  payload.length === 1 && typeof payload[0] === 'string' && /^[0-9a-f-]{36}$/i.test(payload[0]);

export const isSessionInputPayload = (value: unknown): value is SessionInputPayload =>
  isRecord(value) &&
  Object.keys(value).length === 2 &&
  typeof value['playerPortId'] === 'string' &&
  /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(value['playerPortId']) &&
  Array.isArray(value['actions']) &&
  value['actions'].length <= 32 &&
  value['actions'].every(
    (action) => typeof action === 'string' && /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(action),
  ) &&
  new Set(value['actions']).size === value['actions'].length;

export const hasSessionInputPayload = (
  payload: readonly unknown[],
): payload is readonly [SessionInputPayload] =>
  payload.length === 1 && isSessionInputPayload(payload[0]);

export const hasInputProfilePayload = (
  payload: readonly unknown[],
): payload is readonly [InputProfile] =>
  payload.length === 1 && validateInputProfile(payload[0]).ok;

export const createHostVersionResponse = (version: string): HostVersionResponse => ({
  version,
});

export const isHostVersionResponse = (value: unknown): value is HostVersionResponse =>
  isRecord(value) && Object.keys(value).length === 1 && typeof value['version'] === 'string';

export const isSelectRomResponse = (value: unknown): value is SelectRomResponse => {
  if (!isRecord(value)) {
    return false;
  }

  if (Object.keys(value).length === 1 && value['status'] === 'cancelled') {
    return true;
  }

  if (
    Object.keys(value).length !== 2 ||
    value['status'] !== 'selected' ||
    !isRecord(value['rom'])
  ) {
    return false;
  }

  const rom = value['rom'];
  return (
    Object.keys(rom).length === 3 &&
    (rom['extension'] === '.gb' || rom['extension'] === '.gbc') &&
    typeof rom['id'] === 'string' &&
    typeof rom['name'] === 'string'
  );
};

export const isLoadRomResponse = (value: unknown): value is LoadRomResponse => {
  if (!isRecord(value) || typeof value['status'] !== 'string') return false;
  if (value['status'] === 'error') {
    return (
      Object.keys(value).length === 3 &&
      (value['code'] === 'invalid-rom' || value['code'] === 'unavailable') &&
      typeof value['message'] === 'string'
    );
  }
  if (value['status'] !== 'loaded' || Object.keys(value).length !== 2 || !isRecord(value['rom']))
    return false;
  const rom = value['rom'];
  return (
    Object.keys(rom).length === 4 &&
    rom['bytes'] instanceof Uint8Array &&
    (rom['extension'] === '.gb' || rom['extension'] === '.gbc') &&
    typeof rom['name'] === 'string' &&
    typeof rom['selectionId'] === 'string'
  );
};

export const isSessionCommandResponse = (value: unknown): value is SessionCommandResponse =>
  isRecord(value) &&
  ((Object.keys(value).length === 2 &&
    value['status'] === 'ok' &&
    typeof value['sessionStatus'] === 'string') ||
    (Object.keys(value).length === 3 &&
      value['status'] === 'error' &&
      (value['code'] === 'invalid-rom' ||
        value['code'] === 'invalid-state' ||
        value['code'] === 'unavailable' ||
        value['code'] === 'unexpected') &&
      typeof value['message'] === 'string'));

export const isInputConfigurationResponse = (
  value: unknown,
): value is InputConfigurationResponse => {
  if (!isRecord(value) || !validateConsoleInputMapping(value['mapping']).ok) return false;
  return value['profile'] === undefined || validateInputProfile(value['profile']).ok;
};

export const isInputProfileResponse = (value: unknown): value is InputProfileResponse =>
  isRecord(value) &&
  ((value['status'] === 'saved' && validateInputProfile(value['profile']).ok) ||
    (value['status'] === 'error' && typeof value['message'] === 'string'));

const isSessionAudioEvent = (value: unknown): value is SessionAudioEvent =>
  isRecord(value) &&
  Object.keys(value).length === 3 &&
  (value['channels'] === 1 || value['channels'] === 2) &&
  typeof value['sampleRate'] === 'number' &&
  isArrayBuffer(value['samples']);

export const createPixelCoreApi = (
  invoke: IpcInvoker,
  subscribe: IpcSubscriber = () => () => undefined,
): PixelCoreApi => ({
  async getInputConfiguration(): Promise<InputConfigurationResponse> {
    const response = await invoke(IPC_CHANNELS.getInputConfiguration);
    if (!isInputConfigurationResponse(response))
      throw new Error('Received an invalid input configuration response.');
    return response;
  },
  async getHostVersion(): Promise<HostVersionResponse> {
    const response = await invoke(IPC_CHANNELS.getHostVersion);

    if (!isHostVersionResponse(response)) {
      throw new Error('Received an invalid response from the PixelCore host.');
    }

    return response;
  },
  async loadRom(selectionId: string): Promise<LoadRomResponse> {
    const response = await invoke(IPC_CHANNELS.loadRom, selectionId);
    if (!isLoadRomResponse(response)) {
      throw new Error('Received an invalid ROM loading response from the PixelCore host.');
    }
    return response;
  },
  async saveInputProfile(profile: InputProfile): Promise<InputProfileResponse> {
    const response = await invoke(IPC_CHANNELS.saveInputProfile, profile);
    if (!isInputProfileResponse(response))
      throw new Error('Received an invalid input profile response.');
    return response;
  },
  async setSessionInput(input: SessionInputPayload): Promise<SessionCommandResponse> {
    const response = await invoke(IPC_CHANNELS.setSessionInput, input);
    if (!isSessionCommandResponse(response))
      throw new Error('Received an invalid session input response.');
    return response;
  },
  async pauseSession(): Promise<SessionCommandResponse> {
    const response = await invoke(IPC_CHANNELS.pauseSession);
    if (!isSessionCommandResponse(response))
      throw new Error('Received an invalid session response.');
    return response;
  },
  async resumeSession(): Promise<SessionCommandResponse> {
    const response = await invoke(IPC_CHANNELS.resumeSession);
    if (!isSessionCommandResponse(response))
      throw new Error('Received an invalid session response.');
    return response;
  },
  async selectRom(): Promise<SelectRomResponse> {
    const response = await invoke(IPC_CHANNELS.selectRom);

    if (!isSelectRomResponse(response)) {
      throw new Error('Received an invalid ROM selection response from the PixelCore host.');
    }

    return response;
  },
  async startSession(selectionId: string): Promise<SessionCommandResponse> {
    const response = await invoke(IPC_CHANNELS.startSession, selectionId);
    if (!isSessionCommandResponse(response))
      throw new Error('Received an invalid session response.');
    return response;
  },
  async stopSession(): Promise<SessionCommandResponse> {
    const response = await invoke(IPC_CHANNELS.stopSession);
    if (!isSessionCommandResponse(response))
      throw new Error('Received an invalid session response.');
    return response;
  },
  subscribeSessionAudio: (listener) =>
    subscribe(SESSION_EVENT_CHANNELS.audio, (payload) => {
      if (isSessionAudioEvent(payload)) {
        listener({
          channels: payload.channels,
          sampleRate: payload.sampleRate,
          samples: new Float32Array(payload.samples),
        });
      }
    }),
  subscribeSessionVideo: (listener) =>
    subscribe(SESSION_EVENT_CHANNELS.video, (payload) => {
      if (isSessionVideoEvent(payload)) {
        listener({
          height: payload.height,
          pixels: new Uint8Array(payload.pixels),
          width: payload.width,
        });
      }
    }),
});
