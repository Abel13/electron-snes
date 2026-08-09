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
  plugin-sdk/
  emulator-sdk/
  controller-sdk/
  game-sdk/
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
| `packages/plugin-sdk` | `@platform/plugin-sdk` | Plugin manifest, compatibility, and common plugin authoring contracts. |
| `packages/emulator-sdk` | `@platform/emulator-sdk` | Emulator-core contracts and capabilities. |
| `packages/controller-sdk` | `@platform/controller-sdk` | Controller adapter and normalized input contracts. |
| `packages/game-sdk` | `@platform/game-sdk` | Game metadata contracts. |
| `packages/ui` | `@platform/ui` | Renderer-safe UI components, hooks, and presentation contracts. |
| `plugins/*/<plugin-id>` | Plugin package | Third-party or official extension implementation for one supported category. |

## Allowed dependencies

```text
plugins -> specialized SDK -> plugin-sdk -> core -> shared
apps/desktop -> core, SDKs, ui, shared
ui -> renderer-safe contracts, shared
```

Rules:

- `@platform/shared` has no domain dependencies.
- `@platform/core` depends only on `@platform/shared`.
- `@platform/plugin-sdk` depends on core contracts and shared primitives.
- Specialized SDKs depend on `@platform/plugin-sdk` and shared types.
- `@platform/ui` depends only on renderer-safe contracts and shared primitives. It never imports Electron or core implementations.
- `apps/desktop` is the composition root. It can depend on platform packages, but must not import or hardcode concrete plugin implementations.
- A plugin depends on its appropriate SDK and shared types. It never imports core directly, another plugin, the desktop application, UI internals, or Electron internals.

## Forbidden dependencies

- Circular dependencies between any packages.
- Core imports of plugin, console, emulator, controller, game, theme, or integration implementations.
- UI imports of Electron, filesystem APIs, plugin discovery, or emulator lifecycle implementations.
- Plugin imports of application internals or other plugin implementations.
- Console-, controller-, emulator-, or game-specific conditions in generic platform packages when a contract, capability, registry, or mapping can express the behavior.

## Dependency review checklist

Before adding a package or import, verify:

- The owner package is responsible for the behavior.
- The dependency follows the allowed direction.
- The dependency does not create a cycle.
- A plugin can implement equivalent specialized behavior without changing core.
- Renderer code receives only renderer-safe contracts.
- Public contracts are versioned and do not expose internal implementations.

## Next step

Issue `#2`, `Initialize workspace tooling`, materializes this layout with workspace configuration and package manifests. It must not change these boundaries without an ADR.
