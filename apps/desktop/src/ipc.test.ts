import { describe, expect, it } from 'vitest';

import {
  IPC_CHANNELS,
  createPixelCoreApi,
  hasNoIpcPayload,
  isHostVersionResponse,
  isConsolePluginsResponse,
  isLibraryResponse,
  isSelectRomResponse,
  isSessionInputPayload,
} from './ipc.js';

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

  it('accepts only renderer-safe unique console plugin identifiers', async () => {
    expect(isConsolePluginsResponse({ ids: ['org.pixelcore.game-boy-family'] })).toBe(true);
    expect(isConsolePluginsResponse({ ids: ['invalid', 'invalid'] })).toBe(false);
    const api = createPixelCoreApi(async (channel) => {
      expect(channel).toBe(IPC_CHANNELS.listConsolePlugins);
      return { ids: ['org.pixelcore.game-boy-family'] };
    });
    await expect(api.listConsolePlugins()).resolves.toEqual({
      ids: ['org.pixelcore.game-boy-family'],
    });
  });

  it('accepts only an exact ROM-selection response without filesystem paths', () => {
    expect(isSelectRomResponse({ status: 'cancelled' })).toBe(true);
    expect(
      isSelectRomResponse({
        rom: { extension: '.gbc', id: 'selection-1', name: 'game.gbc' },
        status: 'selected',
      }),
    ).toBe(true);
    expect(isSelectRomResponse({ path: '/private/game.gbc', status: 'selected' })).toBe(false);
    expect(
      isSelectRomResponse({
        rom: { extension: '.zip', id: 'selection-1', name: 'game.zip' },
        status: 'selected',
      }),
    ).toBe(false);
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

  it('invokes the allowlisted ROM-selection channel and validates its response', async () => {
    const api = createPixelCoreApi(async (channel) => {
      expect(channel).toBe(IPC_CHANNELS.selectRom);
      return { rom: { extension: '.gb', id: 'selection-1', name: 'game.gb' }, status: 'selected' };
    });

    await expect(api.selectRom()).resolves.toEqual({
      rom: { extension: '.gb', id: 'selection-1', name: 'game.gb' },
      status: 'selected',
    });
  });

  it('accepts only bounded console action snapshots', () => {
    expect(isSessionInputPayload({ actions: ['up', 'a'], playerPortId: 'player-one' })).toBe(true);
    expect(isSessionInputPayload({ actions: ['up', 'up'], playerPortId: 'player-one' })).toBe(
      false,
    );
    expect(isSessionInputPayload({ actions: ['KeyZ'], playerPortId: 'player-one' })).toBe(false);
  });

  it('accepts renderer-safe library records and rejects filesystem paths', () => {
    const game = {
      addedAt: '2026-08-10T00:00:00.000Z',
      extension: '.gbc',
      favorite: true,
      id: '3b343e5d-161a-41db-bd92-d2d1bd177ba8',
      name: 'Local game',
    };
    expect(isLibraryResponse({ games: [game], status: 'ready' })).toBe(true);
    expect(
      isLibraryResponse({ games: [{ ...game, path: '/Users/private/game.gbc' }], status: 'ready' }),
    ).toBe(false);
    expect(
      isLibraryResponse({
        games: [{ ...game, artworkDataUrl: 'file:///private/cover.png' }],
        status: 'ready',
      }),
    ).toBe(false);
  });
});
