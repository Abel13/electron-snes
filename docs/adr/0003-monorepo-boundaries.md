# ADR-0003: Monorepo Package Boundaries

## Status

Aceito.

## Context

The platform needs a monorepo that supports Electron, UI, core services, SDKs, and third-party plugins without allowing specialized implementations to couple the platform core. The repository has architectural principles but no canonical package topology or import direction.

## Decision

Reserve the `apps/`, `packages/`, and `plugins/` layout defined in `docs/architecture/monorepo.md`.

Reserve `@platform/*` for public packages. Use the direction `plugins -> specialized SDK -> plugin-sdk -> core -> shared`.

Reserve `@platform/input`, `@platform/emulator`, and `@platform/library` as runtime domain packages. Reserve `@platform/ui-contracts` as the only renderer-facing contract boundary; `apps/desktop` adapts runtime data into these contracts, while `@platform/ui` depends on `@platform/ui-contracts` and shared primitives only.

Reserve a specialized SDK for each supported plugin type: console, emulator-core, controller, game-metadata, theme, and integration.

This ADR defines the architecture only. Workspace manifests, package directories, and tooling belong to issue `#2`.

## Alternatives considered

- Flat application layout: rejected because Electron, UI, runtime, and extension concerns would share an unclear ownership boundary.
- Core imports concrete plugins: rejected because it reverses dependency direction and blocks third-party extensibility.
- Renderer contracts inside core or UI: rejected because they would either expose core implementations to the renderer or invert the UI dependency direction.
- Create workspace tooling in this decision: rejected because initialization is a separate, independently reviewable concern.

## Consequences

- New packages and imports must follow the documented dependency graph.
- Input, Emulator, and Library runtime behavior have explicit package owners.
- Renderer contracts are introduced through `@platform/ui-contracts`, not application internals.
- Every supported plugin category has a specialized public SDK.
- Plugin implementations remain replaceable and independently testable.
- Workspace initialization must use this topology unless a later ADR supersedes it.
