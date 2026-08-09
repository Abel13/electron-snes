export const IPC_CHANNELS = {
  getHostVersion: 'pixel-core:host-version',
  loadRom: 'pixel-core:load-rom',
  selectRom: 'pixel-core:select-rom',
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
  getHostVersion(): Promise<HostVersionResponse>;
  loadRom(selectionId: string): Promise<LoadRomResponse>;
  selectRom(): Promise<SelectRomResponse>;
}

export type IpcInvoker = (channel: IpcChannel, ...payload: readonly unknown[]) => Promise<unknown>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const hasNoIpcPayload = (payload: readonly unknown[]): boolean => payload.length === 0;

export const hasRomSelectionIdPayload = (
  payload: readonly unknown[],
): payload is readonly [string] =>
  payload.length === 1 && typeof payload[0] === 'string' && /^[0-9a-f-]{36}$/i.test(payload[0]);

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

export const createPixelCoreApi = (invoke: IpcInvoker): PixelCoreApi => ({
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
  async selectRom(): Promise<SelectRomResponse> {
    const response = await invoke(IPC_CHANNELS.selectRom);

    if (!isSelectRomResponse(response)) {
      throw new Error('Received an invalid ROM selection response from the PixelCore host.');
    }

    return response;
  },
});
