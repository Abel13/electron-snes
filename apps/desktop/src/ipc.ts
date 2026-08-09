export const IPC_CHANNELS = {
  getHostVersion: 'pixel-core:host-version',
} as const;

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];

export interface HostVersionResponse {
  readonly version: string;
}

export interface PixelCoreApi {
  getHostVersion(): Promise<HostVersionResponse>;
}

export type IpcInvoker = (channel: IpcChannel) => Promise<unknown>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const hasNoIpcPayload = (payload: readonly unknown[]): boolean => payload.length === 0;

export const createHostVersionResponse = (version: string): HostVersionResponse => ({
  version,
});

export const isHostVersionResponse = (value: unknown): value is HostVersionResponse =>
  isRecord(value) && Object.keys(value).length === 1 && typeof value['version'] === 'string';

export const createPixelCoreApi = (invoke: IpcInvoker): PixelCoreApi => ({
  async getHostVersion(): Promise<HostVersionResponse> {
    const response = await invoke(IPC_CHANNELS.getHostVersion);

    if (!isHostVersionResponse(response)) {
      throw new Error('Received an invalid response from the PixelCore host.');
    }

    return response;
  },
});
