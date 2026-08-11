# ADR 0025: Internationalization strategy

## Status

Accepted.

## Context

PixelCore's final product layout must support Brazilian Portuguese, English, and
Simplified Chinese without coupling localization to the core, emulator, input, or a
specific plugin. Implementing localization during universal-input work would mix
unrelated purposes, while delaying all decisions until the layout is complete would
create avoidable rework in typography, navigation, and plugin contracts.

Community plugins also need a declarative localization boundary that preserves manifest
v1 compatibility and does not execute untrusted translation code.

## Decision

Document the localization contract before Phase 3 and implement it during Phase 4:
Product Experience. Use `en-US` as the canonical catalog and final fallback, with
official `pt-BR` and `zh-CN` catalogs reviewed by humans before release.

Locale resolution uses a persisted user preference first, system detection second, and
`en-US` last. Traditional Chinese locales do not map to Simplified Chinese. Locale
changes apply immediately without restarting the application.

The future renderer implementation uses `i18next` and `react-i18next`, semantic keys,
locale-aware pluralization, and `Intl` formatting. Localization remains renderer-safe;
domain packages do not depend on React localization APIs.

Manifest v1 receives an optional additive `localization` declaration with a default
locale and supported BCP 47 locales. Plugin catalogs use validated JSON at conventional
paths and are namespaced by plugin ID. Existing plugins and the required manifest name
remain valid fallbacks, so plugin API revision `1` is retained.

This decision adds documentation only. It introduces no dependency, catalog, runtime
API, schema change, component change, or translated interface before Phase 4.

## Alternatives considered

- Implementing localization during Phase 3 was rejected because input behavior is
  independent of presentation language and should remain a focused milestone.
- Using visible English strings as keys was rejected because copy edits would invalidate
  catalogs and plugin integrations.
- Mapping all Chinese locales to `zh-CN` was rejected because traditional and simplified
  scripts require independent translation and review.
- Localizing only platform-owned UI was rejected because community plugins would then
  need ad hoc executable translation mechanisms.
- Requiring localization in every manifest was rejected because it would break existing
  plugins and raise the minimum contribution cost.

## Consequences

- Final Phase 4 layouts must be validated for text expansion and CJK typography.
- Official releases require complete English keys and human-reviewed translations.
- Plugin localization remains declarative, optional, and backward compatible.
- Game metadata localization remains outside the platform UI contract.
- Phase 4 must deliver localization foundation, plugin support, official catalogs, and
  localized-layout tests as independently reviewable work.
