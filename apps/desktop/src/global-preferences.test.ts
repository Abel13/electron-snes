import { ok, type JsonStoragePort } from '@platform/core';
import type { JsonObject, JsonValue } from '@platform/shared';
import { describe, expect, it } from 'vitest';
import {
  GlobalPreferencesRepository,
  clearLegacyGlobalPreferences,
  createDefaultGlobalPreferences,
  isGlobalPreferences,
  readLegacyGlobalPreferences,
  type GlobalPreferences,
} from './global-preferences.js';

const preferences: GlobalPreferences = {
  locale: 'pt-BR',
  uiAudioMuted: true,
  uiAudioVolume: 0.45,
  version: 1,
};

describe('global preferences', () => {
  it('resolves safe defaults and validates strict persisted values', () => {
    expect(createDefaultGlobalPreferences('pt-PT')).toEqual({
      locale: 'pt-BR',
      uiAudioMuted: false,
      uiAudioVolume: 0.22,
      version: 1,
    });
    expect(isGlobalPreferences(preferences)).toBe(true);
    expect(isGlobalPreferences({ ...preferences, locale: 'zh-TW' })).toBe(false);
    expect(isGlobalPreferences({ ...preferences, uiAudioVolume: Number.NaN })).toBe(false);
    expect(isGlobalPreferences({ ...preferences, uiAudioVolume: 1.1 })).toBe(false);
    expect(isGlobalPreferences({ ...preferences, extra: true })).toBe(false);
  });

  it('migrates only valid legacy values and clears selected keys explicitly', () => {
    const values = new Map<string, string>([
      ['pixelcore.locale', 'zh-CN'],
      ['pixelcore.uiAudioMuted', 'true'],
      ['pixelcore.uiAudioVolume', 'invalid'],
    ]);
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      removeItem: (key: string) => {
        values.delete(key);
      },
    };
    const migrated = readLegacyGlobalPreferences(storage, 'en-US');
    expect(migrated.preferences).toEqual({
      locale: 'zh-CN',
      uiAudioMuted: true,
      uiAudioVolume: 0.22,
      version: 1,
    });
    clearLegacyGlobalPreferences(storage, migrated.keys);
    expect(values.size).toBe(0);
  });

  it('serializes repository writes and preserves their order', async () => {
    const writes: JsonValue[] = [];
    let releaseFirst: (() => void) | undefined;
    const firstPending = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    const storage: JsonStoragePort = {
      list: async () => ok({} as JsonObject),
      read: async () => ok(undefined),
      remove: async () => ok(undefined),
      write: async (_domain, _key, value) => {
        writes.push(value);
        if (writes.length === 1) await firstPending;
        return ok(undefined);
      },
    };
    const repository = new GlobalPreferencesRepository(storage);
    const first = repository.save(preferences);
    const secondPreferences = { ...preferences, uiAudioVolume: 0.9 } as const;
    const second = repository.save(secondPreferences);
    await Promise.resolve();
    expect(writes).toHaveLength(1);
    releaseFirst?.();
    await Promise.all([first, second]);
    expect(writes).toEqual([preferences, secondPreferences]);
  });
});
