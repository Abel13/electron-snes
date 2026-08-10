import { describe, expect, it } from 'vitest';
import { OFFICIAL_CATALOGS, resolveLocale } from './localization.js';

describe('resolveLocale', () => {
  it('resolves official locales and keeps Traditional Chinese on the English fallback', () => {
    expect(resolveLocale(undefined, 'pt-PT')).toBe('en-US');
    expect(resolveLocale(undefined, 'pt-BR')).toBe('pt-BR');
    expect(resolveLocale(undefined, 'zh-Hans-CN')).toBe('zh-CN');
    expect(resolveLocale(undefined, 'zh-TW')).toBe('en-US');
    expect(resolveLocale('en-US', 'pt-BR')).toBe('en-US');
  });

  it('keeps all official catalogs aligned with the canonical English keys', () => {
    const canonicalKeys = Object.keys(OFFICIAL_CATALOGS['en-US'].translation).sort();
    expect(Object.keys(OFFICIAL_CATALOGS['pt-BR'].translation).sort()).toEqual(canonicalKeys);
    expect(Object.keys(OFFICIAL_CATALOGS['zh-CN'].translation).sort()).toEqual(canonicalKeys);
  });
});
