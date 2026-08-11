# Monorepo Boundaries

## Purpose

This document defines the reserved monorepo layout, package ownership, and allowed dependency direction. It is the authoritative reference for workspace initialization and future package imports.

The public package namespace is reserved as `@platform/*`. This decision does not create manifests, publish packages, or initialize workspace tooling.

## Reserved layout

```text
apps/
  desktop/
packages/
  shared/
  core/
  ui-contracts/
  input/
  emulator/
  library/
  plugin-sdk/
  plugin-test/
  plugin-cli/
  plugin-test/
  console-sdk/
  emulator-sdk/
  controller-sdk/
  game-sdk/
  theme-sdk/
  integration-sdk/
  ui/
plugins/
  consoles/
  emulator-cores/
  controllers/
  games/
  themes/
  integrations/
```

## Ownership

| Location | Reserved package | Responsibility |
| --- | --- | --- |
| `apps/desktop` | Application only | Electron main, preload, renderer bootstrap, and composition root. |
| `packages/shared` | `@platform/shared` | Cross-cutting primitives with no domain dependency. |
| `packages/core` | `@platform/core` | Lifecycle, registry, events, configuration, storage, permissions, and logging contracts. |
| `packages/ui-contracts` | `@platform/ui-contracts` | Renderer-facing DTOs, commands, events, and read models. |
| `packages/input` | `@platform/input` | Device discovery, player assignment, normalized actions, and console mapping. |
| `packages/emulator` | `@platform/emulator` | ROM-session orchestration, capability handling, audio/video ports, and emulator lifecycle. |
| `packages/library` | `@platform/library` | Game identification, metadata and artwork references, favorites, recents, and playtime. |
| `packages/plugin-sdk` | `@platform/plugin-sdk` | Plugin manifest, compatibility, and common plugin authoring contracts. |
| `packages/plugin-test` | `@platform/plugin-test` | Framework-neutral contract validation for plugin definitions and CI. |
| `packages/plugin-cli` | `@platform/plugin-cli` | Deterministic authoring scaffold for validated plugin packages. |
| `packages/plugin-test` | `@platform/plugin-test` | Public plugin contract validation tooling for authors and CI. |
| `packages/console-sdk` | `@platform/console-sdk` | Console plugin contracts and capabilities. |
| `packages/emulator-sdk` | `@platform/emulator-sdk` | Emulator-core contracts and capabilities. |
| `packages/controller-sdk` | `@platform/controller-sdk` | Controller adapter and normalized input contracts. |
| `packages/game-sdk` | `@platform/game-sdk` | Game metadata contracts. |
| `packages/theme-sdk` | `@platform/theme-sdk` | Theme plugin contracts and semantic token extensions. |
| `packages/integration-sdk` | `@platform/integration-sdk` | Third-party integration contracts and permissions. |
| `packages/ui` | `@platform/ui` | UI components, hooks, and presentation behavior. |
| `plugins/*/<plugin-id>` | Plugin package | Third-party or official extension implementation for one supported category. |

## Plugin category mapping

| Plugin type | Required SDK |
| --- | --- |
| `console` | `@platform/console-sdk` |
| `emulator-core` | `@platform/emulator-sdk` |
| `controller` | `@platform/controller-sdk` |
| `game-metadata` | `@platform/game-sdk` |
| `theme` | `@platform/theme-sdk` |
| `integration` | `@platform/integration-sdk` |

## Allowed dependencies

```text
plugins -> specialized SDK -> plugin-sdk -> core -> shared
ui -> ui-contracts -> shared
input -> controller-sdk, core, shared
emulator -> emulator-sdk, core, shared
library -> game-sdk, core, shared
apps/desktop -> ui, ui-contracts, input, emulator, library, core, SDKs, shared
plugin-test -> specialized SDKs -> plugin-sdk -> core -> shared
```

Rules:

- `@platform/shared` has no domain dependencies.
- `@platform/core` depends only on `@platform/shared`.
- `@platform/ui-contracts` depends only on `@platform/shared`.
- `@platform/plugin-sdk` depends on core contracts and shared primitives.
- Specialized SDKs depend on `@platform/plugin-sdk` and shared types.
- `@platform/plugin-test` depends on public specialized SDKs and `@platform/plugin-sdk`; runtime packages never depend on it.
- `@platform/plugin-cli` depends on public plugin contracts and owns authoring-time filesystem writes; runtime packages never depend on it.
- `@platform/plugin-test` may depend on public specialized SDKs for authoring and CI;
  no runtime package or SDK depends on it.
- `@platform/input` depends on core contracts, `@platform/controller-sdk`, and shared types.
- `@platform/emulator` depends on core contracts, `@platform/emulator-sdk`, and shared types.
- `@platform/library` depends on core contracts, `@platform/game-sdk`, and shared types.
- `@platform/ui` depends only on `@platform/ui-contracts` and shared primitives. It never imports Electron, runtime packages, or core implementations.
- `apps/desktop` is the composition root. It adapts core and runtime data into `@platform/ui-contracts`, can depend on platform packages, and must not import or hardcode concrete plugin implementations.
- A plugin depends on its appropriate SDK and shared types. It never imports core directly, another plugin, the desktop application, UI internals, or Electron internals.

## Forbidden dependencies

- Circular dependencies between any packages.
- Core imports of plugin, console, emulator, controller, game, theme, or integration implementations.
- UI imports of Electron, filesystem APIs, runtime packages, plugin discovery, or emulator lifecycle implementations.
- Plugin imports of application internals or other plugin implementations.
- Console-, controller-, emulator-, or game-specific conditions in generic platform packages when a contract, capability, registry, or mapping can express the behavior.

## Dependency review checklist

Before adding a package or import, verify:

- The owner package is responsible for the behavior.
- The dependency follows the allowed direction.
- The dependency does not create a cycle.
- A plugin can implement equivalent specialized behavior without changing core.
- Every plugin type maps to exactly one specialized SDK.
- Every runtime domain has an explicit package owner.
- Renderer code receives only `@platform/ui-contracts` and shared types.
- Public contracts are versioned and do not expose internal implementations.

## Next step

Issue `#2`, `Initialize workspace tooling`, materializes this layout with workspace configuration and package manifests. It must not change these boundaries without an ADR.
