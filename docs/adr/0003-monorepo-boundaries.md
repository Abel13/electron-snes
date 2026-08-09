# ADR-0003: Monorepo Package Boundaries

## Status

Aceito.

## Context

The platform needs a monorepo that supports Electron, UI, core services, SDKs, and third-party plugins without allowing specialized implementations to couple the platform core. The repository has architectural principles but no canonical package topology or import direction.

## Decision

Reserve the `apps/`, `packages/`, and `plugins/` layout defined in `docs/architecture/monorepo.md`.

Reserve `@platform/*` for public packages. Use the direction `plugins -> specialized SDK -> plugin-sdk -> core -> shared`, with `apps/desktop` as the composition root and `packages/ui` limited to renderer-safe contracts.

This ADR defines the architecture only. Workspace manifests, package directories, and tooling belong to issue `#2`.

## Alternatives considered

- Flat application layout: rejected because Electron, UI, runtime, and extension concerns would share an unclear ownership boundary.
- Core imports concrete plugins: rejected because it reverses dependency direction and blocks third-party extensibility.
- Create workspace tooling in this decision: rejected because initialization is a separate, independently reviewable concern.

## Consequences

- New packages and imports must follow the documented dependency graph.
- Public contracts are introduced through SDKs rather than application internals.
- Plugin implementations remain replaceable and independently testable.
- Workspace initialization must use this topology unless a later ADR supersedes it.
