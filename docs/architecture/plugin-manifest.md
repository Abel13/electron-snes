# Plugin Manifest

## Purpose

Every PixelCore plugin exposes a declarative `manifest.json` that identifies the
plugin, declares its public API revision, describes its capabilities, and requests
permissions. `PluginManifestSchema` in `@platform/plugin-sdk` is the canonical v1
schema and the source of the inferred TypeScript `PluginManifest` type.

## Required fields

| Field | Rule |
| --- | --- |
| `id` | Lowercase reverse-DNS identifier with at least two segments, up to 128 characters. |
| `name` | Trimmed human-readable name, 1-120 characters. |
| `version` | SemVer plugin release, up to 64 characters. |
| `apiVersion` | Positive integer public API revision. |
| `type` | `console`, `emulator-core`, `controller`, `game-metadata`, `theme`, or `integration`. |
| `capabilities` | Non-empty, duplicate-free lowercase kebab-case identifiers. |
| `permissions` | Required array of zero or more declarative permission requests. |

The manifest root and permission objects are strict. Unknown fields are rejected.

## Capabilities

Capabilities use lowercase kebab-case identifiers, such as `gamepad-mapping`. They
describe generic behavior and must not encode a product, brand, console, or game.
Each manifest declares at least one capability and cannot repeat one.

## Permissions

Each permission request has a named resource, one or more unique actions, and an
optional rationale. Allowed actions are `read`, `write`, `list`, and `execute`.
Resources use lowercase segments separated by `:`, such as `device:metadata`.

A resource may appear only once in a manifest. A plugin with no requested access uses
an empty `permissions` array.

The manifest only requests access. The host checks each request against its permission
resource definitions and explicit grants; unknown resources remain unavailable and
missing grants are denied. This process never exposes raw filesystem paths, Electron
objects, or unrestricted network access. See `plugin-permissions.md`.

## Compatibility and validation

`apiVersion` declares one plugin API revision. Schema parsing verifies that it is a
positive integer; host-range compatibility is evaluated after parsing.

This schema does not read files, produce platform diagnostics, discover plugins,
activate code, or grant permissions. Runtime validation and diagnostics belong to the
manifest validation boundary in issue `#7`.

Representative JSON inputs for every plugin type and validation outcome are
maintained as [plugin contract fixtures](plugin-contract-fixtures.md).

## Planned localization extension

Phase 4 plans an optional, additive manifest v1 field:

```json
{
  "localization": {
    "defaultLocale": "en-US",
    "locales": ["en-US", "pt-BR", "zh-CN"]
  }
}
```

This field is not accepted by the current strict schema and must not be used before its
dedicated Phase 4 implementation issue. When implemented, catalogs will use validated
JSON at `locales/<locale>.json`, receive a namespace derived from the plugin ID, and
never execute code. The existing `name` remains required and plugins without
localization remain compatible with API revision `1`.

See [Internationalization](../design/internationalization.md) for locale selection,
fallback behavior, catalog rules, and delivery boundaries.
