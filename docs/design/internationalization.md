# Internationalization

## Delivery boundary

PixelCore plans internationalization now and implements it during Phase 4: Product
Experience, together with the final layout. Phase 3 remains focused exclusively on
universal input and introduces no localization dependency, runtime contract, catalog,
or translated component.

The initial official locales are:

| Locale | Purpose |
| --- | --- |
| `en-US` | Canonical source locale and final fallback. |
| `pt-BR` | Brazilian Portuguese. |
| `zh-CN` | Simplified Chinese. |

Traditional Chinese is not part of the initial release. `zh-TW`, `zh-HK`, and
`zh-Hant` must not be treated as `zh-CN`; they fall back to `en-US` until supported as
independent locales.

## Locale selection

Locale resolution follows this order:

1. A persisted user preference, when present and supported.
2. The operating-system locale on first use.
3. `en-US` when no supported match exists.

System matching maps `pt` and `pt-BR` to `pt-BR`; English variants to `en-US`; and
`zh-CN`, `zh-SG`, and `zh-Hans` to `zh-CN`. A user can always override the detected
locale. Changing the preference updates the visible interface immediately and does not
require an application restart.

The preference belongs to user preferences, never plugin configuration. It must not
change game audio, ROM content, save data, or game metadata.

## Catalog rules

- English is the canonical catalog and defines the complete official key set.
- Keys describe intent, such as `library.empty.title`; visible English text is never a
  key.
- Sentences are translated as complete units and are never assembled by concatenating
  translated fragments.
- Plural forms use the active locale rules. Dates, numbers, and durations use `Intl`.
- Interpolation accepts named values only and must not interpret translated content as
  HTML or executable code.
- Missing official keys emit a structured diagnostic in development and fall back to
  `en-US` in the product.
- Official `pt-BR` and `zh-CN` catalogs require human review before release.

The Phase 4 implementation uses `i18next` and `react-i18next` at the renderer boundary.
React components request translation keys; the core, emulator, input adapters, and
Electron main process do not import React localization APIs.

## Layout and accessibility

Final layouts must support longer translated text without clipping, overlap, or hidden
actions. Controls use content-aware sizing and defined wrapping or truncation behavior;
fixed widths are permitted only when all official locales are verified.

The typography system must include readable Simplified Chinese glyphs without changing
the meaning of semantic typography tokens. Locale changes must preserve focus, reading
order, controller navigation, keyboard navigation, accessible names, live-region
announcements, and reduced-motion behavior.

Tests cover common desktop sizes, maximum expected text expansion, CJK rendering,
screen-reader names, and every loading, empty, error, warning, and confirmation state.

## Plugin localization

Phase 4 adds an optional, additive manifest v1 field:

```json
{
  "localization": {
    "defaultLocale": "en-US",
    "locales": ["en-US", "pt-BR", "zh-CN"]
  }
}
```

When present, `defaultLocale` must occur exactly once in the non-empty, duplicate-free
`locales` list. Values use valid BCP 47 language tags. Catalogs use the conventional
plugin-relative path `locales/<locale>.json`; manifests do not provide arbitrary file
paths.

Catalogs are strict JSON objects with semantic keys and string messages. They are
validated before use, never execute code, and receive a namespace derived from the
plugin reverse-DNS ID. A plugin can declare additional BCP 47 locales, but the initial
host selects only its three official locales.

The existing manifest `name` remains required and is the safe display-name fallback
when localization is absent, invalid, unsupported, or unavailable. Plugins without the
new field remain valid. Because the field is optional and additive, it does not require
a new plugin API revision.

## Excluded content

The platform translates its interface, diagnostics, and official plugin-facing text.
Game titles, descriptions, genres, artwork, ROM data, save files, and save states are
not translated by this system. Localized game metadata remains the responsibility of a
future metadata provider and its explicit contracts.

## Phase 4 backlog

Implementation remains split into independently reviewable issues:

1. `Build localization foundation`
2. `Extend plugin localization`
3. `Localize official interface`
4. `Test localized layouts`

Implementation, public plugin contracts, translated content, and localized-layout tests
use separate commits and issues whenever they can be delivered independently.
