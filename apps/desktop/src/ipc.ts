import type { ConsoleInputMapping, InputProfile } from '@platform/input';
import { validateConsoleInputMapping, validateInputProfile } from '@platform/input';
import { isGlobalPreferences, type GlobalPreferences } from './global-preferences.js';

export const IPC_CHANNELS = {
  importGame: 'pixel-core:import-game',
  listLibrary: 'pixel-core:list-library',
  listConsolePlugins: 'pixel-core:list-console-plugins',
  getInputConfiguration: 'pixel-core:get-input-configuration',
  getGlobalPreferences: 'pixel-core:get-global-preferences',
  getHostVersion: 'pixel-core:host-version',
  loadRom: 'pixel-core:load-rom',
  pauseSession: 'pixel-core:pause-session',
  resumeSession: 'pixel-core:resume-session',
  saveInputProfile: 'pixel-core:save-input-profile',
  saveGlobalPreferences: 'pixel-core:save-global-preferences',
  selectGameArtwork: 'pixel-core:select-game-artwork',
  selectRom: 'pixel-core:select-rom',
  setSessionInput: 'pixel-core:set-session-input',
  startSession: 'pixel-core:start-session',
  startLibraryGame: 'pixel-core:start-library-game',
  stopSession: 'pixel-core:stop-session',
  updateFavorite: 'pixel-core:update-favorite',
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
  getGlobalPreferences(): Promise<GlobalPreferencesLoadResponse>;
  getInputConfiguration(): Promise<InputConfigurationResponse>;
  getHostVersion(): Promise<HostVersionResponse>;
  importGame(): Promise<ImportGameResponse>;
  listLibrary(): Promise<LibraryResponse>;
  listConsolePlugins(): Promise<ConsolePluginsResponse>;
  loadRom(selectionId: string): Promise<LoadRomResponse>;
  pauseSession(): Promise<SessionCommandResponse>;
  resumeSession(): Promise<SessionCommandResponse>;
  saveInputProfile(profile: InputProfile): Promise<InputProfileResponse>;
  saveGlobalPreferences(preferences: GlobalPreferences): Promise<GlobalPreferencesSaveResponse>;
  selectGameArtwork(gameId: string): Promise<LibraryMutationResponse>;
  selectRom(): Promise<SelectRomResponse>;
  setSessionInput(input: SessionInputPayload): Promise<SessionCommandResponse>;
  startSession(selectionId: string): Promise<SessionCommandResponse>;
  startLibraryGame(gameId: string): Promise<SessionCommandResponse>;
  stopSession(): Promise<SessionCommandResponse>;
  subscribeSessionAudio(listener: (frame: SessionAudioFrame) => void): () => void;
  subscribeSessionVideo(listener: (frame: SessionVideoFrame) => void): () => void;
  updateFavorite(gameId: string, favorite: boolean): Promise<LibraryMutationResponse>;
}

export interface ConsolePluginsResponse {
  readonly ids: readonly string[];
}

export interface LibraryGame {
  readonly addedAt: string;
  readonly artworkDataUrl?: string;
  readonly extension: '.gb' | '.gbc';
  readonly favorite: boolean;
  readonly id: string;
  readonly lastPlayedAt?: string;
  readonly name: string;
}

export type LibraryResponse =
  | { readonly games: readonly LibraryGame[]; readonly status: 'ready' }
  | { readonly message: string; readonly status: 'error' };

export type ImportGameResponse =
  | { readonly status: 'cancelled' }
  | { readonly game: LibraryGame; readonly status: 'imported' }
  | { readonly message: string; readonly status: 'error' };

export type LibraryMutationResponse =
  | { readonly status: 'cancelled' }
  | { readonly game: LibraryGame; readonly status: 'updated' }
  | { readonly message: string; readonly status: 'error' };

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

export type GlobalPreferencesLoadResponse =
  | { readonly preferences?: GlobalPreferences; readonly status: 'ready' }
  | { readonly message: string; readonly status: 'error' };

export type GlobalPreferencesSaveResponse =
  | { readonly preferences: GlobalPreferences; readonly status: 'saved' }
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

export const hasLibraryGameIdPayload = hasRomSelectionIdPayload;

export const hasFavoritePayload = (
  payload: readonly unknown[],
): payload is readonly [string, boolean] =>
  payload.length === 2 &&
  typeof payload[0] === 'string' &&
  /^[0-9a-f-]{36}$/i.test(payload[0]) &&
  typeof payload[1] === 'boolean';

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

export const hasGlobalPreferencesPayload = (
  payload: readonly unknown[],
): payload is readonly [GlobalPreferences] =>
  payload.length === 1 && isGlobalPreferences(payload[0]);

export const isGlobalPreferencesLoadResponse = (
  value: unknown,
): value is GlobalPreferencesLoadResponse =>
  isRecord(value) &&
  ((value['status'] === 'ready' &&
    Object.keys(value).every((key) => key === 'status' || key === 'preferences') &&
    (value['preferences'] === undefined || isGlobalPreferences(value['preferences']))) ||
    (value['status'] === 'error' &&
      Object.keys(value).length === 2 &&
      typeof value['message'] === 'string'));

export const isGlobalPreferencesSaveResponse = (
  value: unknown,
): value is GlobalPreferencesSaveResponse =>
  isRecord(value) &&
  ((value['status'] === 'saved' &&
    Object.keys(value).length === 2 &&
    isGlobalPreferences(value['preferences'])) ||
    (value['status'] === 'error' &&
      Object.keys(value).length === 2 &&
      typeof value['message'] === 'string'));

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

const isLibraryGame = (value: unknown): value is LibraryGame =>
  isRecord(value) &&
  Object.keys(value).every((key) =>
    ['addedAt', 'artworkDataUrl', 'extension', 'favorite', 'id', 'lastPlayedAt', 'name'].includes(
      key,
    ),
  ) &&
  typeof value['addedAt'] === 'string' &&
  (value['extension'] === '.gb' || value['extension'] === '.gbc') &&
  typeof value['favorite'] === 'boolean' &&
  typeof value['id'] === 'string' &&
  typeof value['name'] === 'string' &&
  (value['lastPlayedAt'] === undefined || typeof value['lastPlayedAt'] === 'string') &&
  (value['artworkDataUrl'] === undefined ||
    (typeof value['artworkDataUrl'] === 'string' &&
      value['artworkDataUrl'].startsWith('data:image/')));

export const isLibraryResponse = (value: unknown): value is LibraryResponse =>
  isRecord(value) &&
  ((value['status'] === 'ready' &&
    Array.isArray(value['games']) &&
    value['games'].every(isLibraryGame)) ||
    (value['status'] === 'error' && typeof value['message'] === 'string'));

export const isConsolePluginsResponse = (value: unknown): value is ConsolePluginsResponse =>
  isRecord(value) &&
  Object.keys(value).length === 1 &&
  Array.isArray(value['ids']) &&
  value['ids'].every((id) => typeof id === 'string' && /^[a-z0-9]+(?:[.-][a-z0-9-]+)+$/.test(id)) &&
  new Set(value['ids']).size === value['ids'].length;

export const isImportGameResponse = (value: unknown): value is ImportGameResponse =>
  isRecord(value) &&
  (value['status'] === 'cancelled' ||
    (value['status'] === 'imported' && isLibraryGame(value['game'])) ||
    (value['status'] === 'error' && typeof value['message'] === 'string'));

export const isLibraryMutationResponse = (value: unknown): value is LibraryMutationResponse =>
  isRecord(value) &&
  (value['status'] === 'cancelled' ||
    (value['status'] === 'updated' && isLibraryGame(value['game'])) ||
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
  async getGlobalPreferences(): Promise<GlobalPreferencesLoadResponse> {
    const response = await invoke(IPC_CHANNELS.getGlobalPreferences);
    if (!isGlobalPreferencesLoadResponse(response))
      throw new Error('Received an invalid global preferences response.');
    return response;
  },
  async importGame(): Promise<ImportGameResponse> {
    const response = await invoke(IPC_CHANNELS.importGame);
    if (!isImportGameResponse(response))
      throw new Error('Received an invalid game import response.');
    return response;
  },
  async listLibrary(): Promise<LibraryResponse> {
    const response = await invoke(IPC_CHANNELS.listLibrary);
    if (!isLibraryResponse(response)) throw new Error('Received an invalid library response.');
    return response;
  },
  async listConsolePlugins(): Promise<ConsolePluginsResponse> {
    const response = await invoke(IPC_CHANNELS.listConsolePlugins);
    if (!isConsolePluginsResponse(response))
      throw new Error('Received an invalid console plugin response.');
    return response;
  },
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
  async saveGlobalPreferences(
    preferences: GlobalPreferences,
  ): Promise<GlobalPreferencesSaveResponse> {
    const response = await invoke(IPC_CHANNELS.saveGlobalPreferences, preferences);
    if (!isGlobalPreferencesSaveResponse(response))
      throw new Error('Received an invalid global preferences save response.');
    return response;
  },
  async selectGameArtwork(gameId: string): Promise<LibraryMutationResponse> {
    const response = await invoke(IPC_CHANNELS.selectGameArtwork, gameId);
    if (!isLibraryMutationResponse(response))
      throw new Error('Received an invalid artwork response.');
    return response;
  },
  async setSessionInput(input: SessionInputPayload): Promise<SessionCommandResponse> {
    const response = await invoke(IPC_CHANNELS.setSessionInput, input);
    if (!isSessionCommandResponse(response))
      throw new Error('Received an invalid session input response.');
    return response;
  },
  async startLibraryGame(gameId: string): Promise<SessionCommandResponse> {
    const response = await invoke(IPC_CHANNELS.startLibraryGame, gameId);
    if (!isSessionCommandResponse(response))
      throw new Error('Received an invalid library session response.');
    return response;
  },
  async updateFavorite(gameId: string, favorite: boolean): Promise<LibraryMutationResponse> {
    const response = await invoke(IPC_CHANNELS.updateFavorite, gameId, favorite);
    if (!isLibraryMutationResponse(response))
      throw new Error('Received an invalid favorite response.');
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
