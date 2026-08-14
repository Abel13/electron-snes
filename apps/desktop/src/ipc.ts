import type { ConsoleInputMapping, InputProfile } from '@platform/input';
import { validateConsoleInputMapping, validateInputProfile } from '@platform/input';
import { isGlobalPreferences, type GlobalPreferences } from './global-preferences.js';
import { SAVE_STATE_SLOTS, type SaveStateDescriptor, type SaveStateSlot } from '@platform/emulator';
import type { EmulatorCapabilities } from '@platform/emulator-sdk';
import { isResolvedGameMetadata, type ResolvedGameMetadata } from '@platform/game-sdk';

export const IPC_CHANNELS = {
  importGame: 'pixel-core:import-game',
  listLibrary: 'pixel-core:list-library',
  listConsolePlugins: 'pixel-core:list-console-plugins',
  getInputConfiguration: 'pixel-core:get-input-configuration',
  getGlobalPreferences: 'pixel-core:get-global-preferences',
  getHostVersion: 'pixel-core:host-version',
  getUpdateState: 'pixel-core:get-update-state',
  getEmulatorCapabilities: 'pixel-core:emulator-capabilities',
  loadRom: 'pixel-core:load-rom',
  listSaveStates: 'pixel-core:list-save-states',
  pauseSession: 'pixel-core:pause-session',
  quitApplication: 'pixel-core:quit-application',
  checkForUpdates: 'pixel-core:check-for-updates',
  downloadUpdate: 'pixel-core:download-update',
  installUpdate: 'pixel-core:install-update',
  resumeSession: 'pixel-core:resume-session',
  captureSaveState: 'pixel-core:capture-save-state',
  restoreSaveState: 'pixel-core:restore-save-state',
  saveInputProfile: 'pixel-core:save-input-profile',
  saveGlobalPreferences: 'pixel-core:save-global-preferences',
  selectGameArtwork: 'pixel-core:select-game-artwork',
  selectRom: 'pixel-core:select-rom',
  setSessionInput: 'pixel-core:set-session-input',
  setFastForwardActive: 'pixel-core:set-fast-forward-active',
  setRewindActive: 'pixel-core:set-rewind-active',
  startSession: 'pixel-core:start-session',
  startLibraryGame: 'pixel-core:start-library-game',
  stopSession: 'pixel-core:stop-session',
  updateFavorite: 'pixel-core:update-favorite',
} as const;

export const SESSION_EVENT_CHANNELS = {
  audio: 'pixel-core:session-audio',
  video: 'pixel-core:session-video',
} as const;

export const UPDATE_EVENT_CHANNEL = 'pixel-core:update-state' as const;

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];

export interface HostVersionResponse {
  readonly version: string;
}

export interface SelectedRom {
  readonly extension: '.gb' | '.gbc' | '.gba';
  readonly id: string;
  readonly name: string;
}

export interface LoadedRom {
  readonly bytes: Uint8Array;
  readonly extension: '.gb' | '.gbc' | '.gba';
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

export type LibraryLaunchMode = 'fresh' | 'restore-autosave';
export type LibraryLaunchResponse =
  SessionCommandResponse | { readonly status: 'autosave-available'; readonly updatedAt: string };

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
  checkForUpdates(): Promise<UpdateState>;
  downloadUpdate(): Promise<UpdateState>;
  getGlobalPreferences(): Promise<GlobalPreferencesLoadResponse>;
  getInputConfiguration(): Promise<InputConfigurationResponse>;
  getHostVersion(): Promise<HostVersionResponse>;
  getUpdateState(): Promise<UpdateState>;
  getEmulatorCapabilities(): Promise<EmulatorCapabilities>;
  importGame(): Promise<ImportGameResponse>;
  listLibrary(): Promise<LibraryResponse>;
  listConsolePlugins(): Promise<ConsolePluginsResponse>;
  listSaveStates(): Promise<SaveStateListResponse>;
  loadRom(selectionId: string): Promise<LoadRomResponse>;
  pauseSession(): Promise<SessionCommandResponse>;
  captureSaveState(slot: SaveStateSlot): Promise<SessionCommandResponse>;
  quitApplication(): Promise<void>;
  installUpdate(): Promise<void>;
  resumeSession(): Promise<SessionCommandResponse>;
  restoreSaveState(slot: SaveStateSlot): Promise<SessionCommandResponse>;
  saveInputProfile(profile: InputProfile): Promise<InputProfileResponse>;
  saveGlobalPreferences(preferences: GlobalPreferences): Promise<GlobalPreferencesSaveResponse>;
  selectGameArtwork(gameId: string): Promise<LibraryMutationResponse>;
  selectRom(): Promise<SelectRomResponse>;
  setSessionInput(input: SessionInputPayload): Promise<SessionCommandResponse>;
  setFastForwardActive(active: boolean): Promise<SessionCommandResponse>;
  setRewindActive(active: boolean): Promise<SessionCommandResponse>;
  startSession(selectionId: string): Promise<SessionCommandResponse>;
  startLibraryGame(gameId: string, mode?: LibraryLaunchMode): Promise<LibraryLaunchResponse>;
  stopSession(): Promise<SessionCommandResponse>;
  subscribeSessionAudio(listener: (frame: SessionAudioFrame) => void): () => void;
  subscribeSessionVideo(listener: (frame: SessionVideoFrame) => void): () => void;
  subscribeUpdateState(listener: (state: UpdateState) => void): () => void;
  updateFavorite(gameId: string, favorite: boolean): Promise<LibraryMutationResponse>;
}

export type UpdateState =
  | { readonly currentVersion: string; readonly status: 'idle' | 'checking' | 'not-available' }
  | { readonly currentVersion: string; readonly status: 'unsupported' }
  | { readonly currentVersion: string; readonly message: string; readonly status: 'error' }
  | { readonly currentVersion: string; readonly status: 'available'; readonly version: string }
  | {
      readonly currentVersion: string;
      readonly percent: number;
      readonly status: 'downloading';
      readonly version: string;
    }
  | { readonly currentVersion: string; readonly status: 'downloaded'; readonly version: string };

export interface ConsolePluginsResponse {
  readonly plugins: readonly ConsolePluginAssetEntry[];
}

export interface ConsolePluginAssetEntry {
  readonly accentColor: string;
  readonly assets: {
    readonly consoleHeroUrl: string;
    readonly cartridgeUrl?: string;
    readonly blueprintUrl?: string;
    readonly sessionBackdropUrl?: string;
    readonly cartridgeLabelMaskUrl?: string;
    readonly controlDiagram?: {
      readonly alt: string;
      readonly controlPoints: readonly {
        readonly action: string;
        readonly x: number;
        readonly y: number;
      }[];
    };
  };
  readonly extensions: readonly string[];
  readonly generationKey: string;
  readonly id: string;
  readonly name: string;
}

export interface LibraryGame {
  readonly addedAt: string;
  readonly artworkDataUrl?: string;
  readonly extension: '.gb' | '.gbc' | '.gba';
  readonly favorite: boolean;
  readonly id: string;
  readonly lastPlayedAt?: string;
  readonly name: string;
  readonly metadata?: ResolvedGameMetadata;
  readonly playtimeMilliseconds: number;
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

export const hasSaveStateSlotPayload = (
  payload: readonly unknown[],
): payload is readonly [SaveStateSlot] =>
  payload.length === 1 && SAVE_STATE_SLOTS.includes(payload[0] as SaveStateSlot);

export const hasBooleanPayload = (payload: readonly unknown[]): payload is readonly [boolean] =>
  payload.length === 1 && typeof payload[0] === 'boolean';

export const hasLibraryLaunchPayload = (
  payload: readonly unknown[],
): payload is readonly [string, LibraryLaunchMode?] =>
  (payload.length === 1 || payload.length === 2) &&
  typeof payload[0] === 'string' &&
  (payload[1] === undefined || payload[1] === 'fresh' || payload[1] === 'restore-autosave');

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
  channel:
    | (typeof SESSION_EVENT_CHANNELS)[keyof typeof SESSION_EVENT_CHANNELS]
    | typeof UPDATE_EVENT_CHANNEL,
  listener: (payload: unknown) => void,
) => () => void;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isArrayBuffer = (value: unknown): value is ArrayBuffer =>
  Object.prototype.toString.call(value) === '[object ArrayBuffer]';

export const isUpdateState = (value: unknown): value is UpdateState => {
  if (!isRecord(value) || typeof value['currentVersion'] !== 'string') return false;
  const status = value['status'];
  if (
    status === 'idle' ||
    status === 'checking' ||
    status === 'not-available' ||
    status === 'unsupported'
  )
    return Object.keys(value).length === 2;
  if (status === 'error')
    return Object.keys(value).length === 3 && typeof value['message'] === 'string';
  if (status === 'available' || status === 'downloaded')
    return Object.keys(value).length === 3 && typeof value['version'] === 'string';
  return (
    status === 'downloading' &&
    Object.keys(value).length === 4 &&
    typeof value['version'] === 'string' &&
    typeof value['percent'] === 'number' &&
    Number.isFinite(value['percent']) &&
    value['percent'] >= 0 &&
    value['percent'] <= 100
  );
};

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
    (rom['extension'] === '.gb' || rom['extension'] === '.gbc' || rom['extension'] === '.gba') &&
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
    (rom['extension'] === '.gb' || rom['extension'] === '.gbc' || rom['extension'] === '.gba') &&
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

export const isEmulatorCapabilities = (value: unknown): value is EmulatorCapabilities =>
  isRecord(value) &&
  Object.keys(value).length === 3 &&
  typeof value['fastForward'] === 'boolean' &&
  typeof value['rewind'] === 'boolean' &&
  typeof value['saveStates'] === 'boolean';

export const isSaveStateListResponse = (value: unknown): value is SaveStateListResponse =>
  isRecord(value) &&
  ((value['status'] === 'error' &&
    typeof value['message'] === 'string' &&
    ['invalid-state', 'unavailable', 'unexpected'].includes(String(value['code']))) ||
    (value['status'] === 'ok' &&
      value['capability'] === true &&
      Array.isArray(value['slots']) &&
      value['slots'].every(
        (slot) =>
          isRecord(slot) &&
          Object.keys(slot).length === 3 &&
          SAVE_STATE_SLOTS.includes(slot['slot'] as SaveStateSlot) &&
          typeof slot['sizeBytes'] === 'number' &&
          typeof slot['updatedAt'] === 'string',
      )));

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
    [
      'addedAt',
      'artworkDataUrl',
      'extension',
      'favorite',
      'id',
      'lastPlayedAt',
      'name',
      'metadata',
      'playtimeMilliseconds',
    ].includes(key),
  ) &&
  typeof value['addedAt'] === 'string' &&
  (value['extension'] === '.gb' ||
    value['extension'] === '.gbc' ||
    value['extension'] === '.gba') &&
  typeof value['favorite'] === 'boolean' &&
  typeof value['id'] === 'string' &&
  typeof value['name'] === 'string' &&
  (value['metadata'] === undefined || isResolvedGameMetadata(value['metadata'])) &&
  Number.isSafeInteger(value['playtimeMilliseconds']) &&
  (value['playtimeMilliseconds'] as number) >= 0 &&
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
  Array.isArray(value['plugins']) &&
  new Set(value['plugins'].filter(isRecord).map((plugin) => plugin['id'])).size ===
    value['plugins'].length &&
  value['plugins'].every((plugin) => {
    if (
      !isRecord(plugin) ||
      typeof plugin['id'] !== 'string' ||
      typeof plugin['name'] !== 'string' ||
      typeof plugin['generationKey'] !== 'string'
    )
      return false;
    const assets = plugin['assets'];
    return (
      isRecord(assets) &&
      typeof assets['consoleHeroUrl'] === 'string' &&
      assets['consoleHeroUrl'].startsWith('data:image/') &&
      Array.isArray(plugin['extensions']) &&
      plugin['extensions'].every((extension) => typeof extension === 'string')
    );
  });

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

export const isLibraryLaunchResponse = (value: unknown): value is LibraryLaunchResponse =>
  isSessionCommandResponse(value) ||
  (isRecord(value) &&
    Object.keys(value).length === 2 &&
    value['status'] === 'autosave-available' &&
    typeof value['updatedAt'] === 'string');

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
  async checkForUpdates(): Promise<UpdateState> {
    const response = await invoke(IPC_CHANNELS.checkForUpdates);
    if (!isUpdateState(response)) throw new Error('Received an invalid update state.');
    return response;
  },
  async downloadUpdate(): Promise<UpdateState> {
    const response = await invoke(IPC_CHANNELS.downloadUpdate);
    if (!isUpdateState(response)) throw new Error('Received an invalid update state.');
    return response;
  },
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
  async listSaveStates(): Promise<SaveStateListResponse> {
    const response = await invoke(IPC_CHANNELS.listSaveStates);
    if (!isSaveStateListResponse(response)) throw new Error('Received an invalid save-state list.');
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
  async getUpdateState(): Promise<UpdateState> {
    const response = await invoke(IPC_CHANNELS.getUpdateState);
    if (!isUpdateState(response)) throw new Error('Received an invalid update state.');
    return response;
  },
  async getEmulatorCapabilities(): Promise<EmulatorCapabilities> {
    const response = await invoke(IPC_CHANNELS.getEmulatorCapabilities);
    if (!isEmulatorCapabilities(response))
      throw new Error('Received invalid emulator capabilities.');
    return response;
  },
  async quitApplication(): Promise<void> {
    await invoke(IPC_CHANNELS.quitApplication);
  },
  async installUpdate(): Promise<void> {
    await invoke(IPC_CHANNELS.installUpdate);
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
  async setFastForwardActive(active: boolean): Promise<SessionCommandResponse> {
    const response = await invoke(IPC_CHANNELS.setFastForwardActive, active);
    if (!isSessionCommandResponse(response))
      throw new Error('Received an invalid fast-forward response.');
    return response;
  },
  async setRewindActive(active: boolean): Promise<SessionCommandResponse> {
    const response = await invoke(IPC_CHANNELS.setRewindActive, active);
    if (!isSessionCommandResponse(response))
      throw new Error('Received an invalid rewind response.');
    return response;
  },
  async startLibraryGame(gameId: string, mode?: LibraryLaunchMode): Promise<LibraryLaunchResponse> {
    const response = await invoke(
      IPC_CHANNELS.startLibraryGame,
      gameId,
      ...(mode === undefined ? [] : [mode]),
    );
    if (!isLibraryLaunchResponse(response))
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
  async captureSaveState(slot: SaveStateSlot): Promise<SessionCommandResponse> {
    const response = await invoke(IPC_CHANNELS.captureSaveState, slot);
    if (!isSessionCommandResponse(response))
      throw new Error('Received an invalid save-state response.');
    return response;
  },
  async resumeSession(): Promise<SessionCommandResponse> {
    const response = await invoke(IPC_CHANNELS.resumeSession);
    if (!isSessionCommandResponse(response))
      throw new Error('Received an invalid session response.');
    return response;
  },
  async restoreSaveState(slot: SaveStateSlot): Promise<SessionCommandResponse> {
    const response = await invoke(IPC_CHANNELS.restoreSaveState, slot);
    if (!isSessionCommandResponse(response))
      throw new Error('Received an invalid save-state response.');
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
  subscribeUpdateState: (listener) =>
    subscribe(UPDATE_EVENT_CHANNEL, (payload) => {
      if (isUpdateState(payload)) listener(payload);
    }),
});
