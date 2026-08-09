import { describe, expect, it } from 'vitest';

import { IPC_CHANNELS, createPixelCoreApi, hasNoIpcPayload, isHostVersionResponse } from './ipc.js';

describe('IPC boundary contracts', () => {
  it('accepts only an exact host-version response', () => {
    expect(isHostVersionResponse({ version: '0.1.0' })).toBe(true);
    expect(isHostVersionResponse({ version: '0.1.0', extra: true })).toBe(false);
    expect(isHostVersionResponse({ version: 1 })).toBe(false);
    expect(isHostVersionResponse(null)).toBe(false);
  });

  it('accepts only an empty request payload for host version', () => {
    expect(hasNoIpcPayload([])).toBe(true);
    expect(hasNoIpcPayload(['untrusted'])).toBe(false);
  });

  it('invokes the allowlisted channel and validates its response', async () => {
    const invoke = async (channel: string): Promise<unknown> => {
      expect(channel).toBe(IPC_CHANNELS.getHostVersion);

      return { version: '0.1.0' };
    };

    await expect(createPixelCoreApi(invoke).getHostVersion()).resolves.toEqual({
      version: '0.1.0',
    });
  });

  it('rejects malformed host responses without exposing them', async () => {
    const api = createPixelCoreApi(async () => ({ version: 1 }));

    await expect(api.getHostVersion()).rejects.toThrow(
      'Received an invalid response from the PixelCore host.',
    );
  });
});
