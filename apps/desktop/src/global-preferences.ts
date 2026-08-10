import { err, ok, type JsonStoragePort, type Result } from '@platform/core';

export const SUPPORTED_LOCALES = ['en-US', 'pt-BR', 'zh-CN'] as const;
export type GlobalPreferenceLocale = (typeof SUPPORTED_LOCALES)[number];

export interface GlobalPreferences {
  readonly locale: GlobalPreferenceLocale;
  readonly uiAudioMuted: boolean;
  readonly uiAudioVolume: number;
  readonly version: 1;
}

export interface LegacyPreferenceStorage {
  getItem(key: string): string | null;
  removeItem(key: string): void;
}

export const LEGACY_GLOBAL_PREFERENCE_KEYS = [
  'pixelcore.locale',
  'pixelcore.uiAudioMuted',
  'pixelcore.uiAudioVolume',
] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const isSupportedLocale = (value: unknown): value is GlobalPreferenceLocale =>
  typeof value === 'string' && SUPPORTED_LOCALES.some((locale) => locale === value);

export const isGlobalPreferences = (value: unknown): value is GlobalPreferences =>
  isRecord(value) &&
  Object.keys(value).length === 4 &&
  value['version'] === 1 &&
  isSupportedLocale(value['locale']) &&
  typeof value['uiAudioMuted'] === 'boolean' &&
  typeof value['uiAudioVolume'] === 'number' &&
  Number.isFinite(value['uiAudioVolume']) &&
  value['uiAudioVolume'] >= 0 &&
  value['uiAudioVolume'] <= 1;

export const resolveSystemLocale = (locale: string): GlobalPreferenceLocale => {
  const normalized = locale.toLowerCase();
  if (normalized === 'zh-cn' || normalized === 'zh-sg' || normalized === 'zh-hans') return 'zh-CN';
  if (normalized === 'pt' || normalized.startsWith('pt-')) return 'pt-BR';
  if (normalized === 'en' || normalized.startsWith('en-')) return 'en-US';
  return 'en-US';
};

export const createDefaultGlobalPreferences = (systemLocale: string): GlobalPreferences => ({
  locale: resolveSystemLocale(systemLocale),
  uiAudioMuted: false,
  uiAudioVolume: 0.22,
  version: 1,
});

export const readLegacyGlobalPreferences = (
  storage: LegacyPreferenceStorage,
  systemLocale: string,
): { readonly keys: readonly string[]; readonly preferences: GlobalPreferences } => {
  const defaults = createDefaultGlobalPreferences(systemLocale);
  const locale = storage.getItem(LEGACY_GLOBAL_PREFERENCE_KEYS[0]);
  const muted = storage.getItem(LEGACY_GLOBAL_PREFERENCE_KEYS[1]);
  const volume = storage.getItem(LEGACY_GLOBAL_PREFERENCE_KEYS[2]);
  const parsedVolume = volume === null ? Number.NaN : Number(volume);
  return {
    keys: LEGACY_GLOBAL_PREFERENCE_KEYS.filter((key) => storage.getItem(key) !== null),
    preferences: {
      locale: isSupportedLocale(locale) ? locale : defaults.locale,
      uiAudioMuted: muted === 'true' ? true : muted === 'false' ? false : defaults.uiAudioMuted,
      uiAudioVolume:
        Number.isFinite(parsedVolume) && parsedVolume >= 0 && parsedVolume <= 1
          ? parsedVolume
          : defaults.uiAudioVolume,
      version: 1,
    },
  };
};

export const clearLegacyGlobalPreferences = (
  storage: LegacyPreferenceStorage,
  keys: readonly string[],
): void => {
  for (const key of keys) storage.removeItem(key);
};

export class GlobalPreferencesRepository {
  private writes: Promise<void> = Promise.resolve();

  public constructor(private readonly storage: JsonStoragePort) {}

  public async load(): Promise<Result<GlobalPreferences | undefined>> {
    const loaded = await this.storage.read('user-preferences', 'global');
    if (!loaded.ok) return loaded;
    if (loaded.value === undefined) return ok(undefined);
    return isGlobalPreferences(loaded.value)
      ? ok(loaded.value)
      : err({ code: 'invalid-input', message: 'Stored global preferences are invalid.' });
  }

  public save(preferences: GlobalPreferences): Promise<Result<void>> {
    if (!isGlobalPreferences(preferences))
      return Promise.resolve(
        err({ code: 'invalid-input', message: 'Global preferences are invalid.' }),
      );
    const operation = this.writes.then(() =>
      this.storage.write('user-preferences', 'global', {
        locale: preferences.locale,
        uiAudioMuted: preferences.uiAudioMuted,
        uiAudioVolume: preferences.uiAudioVolume,
        version: preferences.version,
      }),
    );
    this.writes = operation.then(
      () => undefined,
      () => undefined,
    );
    return operation;
  }
}
