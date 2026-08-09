# ADR-0008: Plugin Registry

## Context

After manifest validation, PixelCore needs a stable host boundary that retains
structurally valid plugins and preserves API-incompatible manifests for diagnostics.
The core cannot import plugin manifest types, while plugin registration must not gain
filesystem, module loading, activation, or permission authority.

## Decision

Implement an asynchronous `InMemoryRegistry<T>` in `@platform/core` behind the
existing generic `Registry<T>` port. It stores entries by ID, lists them in
deterministic order, and returns `Result` failures for conflicts and missing entries.

Expose `PluginRegistry` from `@platform/plugin-sdk` as the manifest-specific adapter.
It accepts only `ValidPluginManifest` and `InactivePluginManifest`, stores them as
`eligible` or `inactive` records, and preserves inactive compatibility diagnostics.
Invalid validation results are not registrable.

## Alternatives considered

- Put manifest-specific registry code in `@platform/core`: rejected because it would
  invert the dependency from core to plugin SDK contracts.
- Register invalid manifests: rejected because they have no trusted plugin identity.
- Load or activate plugins during registration: rejected because validation and
  registry state must remain safe before code execution or permission evaluation.
- Persist registry state now: rejected because storage selection and lifecycle are
  separate concerns.

## Consequences

- Hosts can inspect compatible and incompatible discovered plugins through one typed
  registry without executing them.
- Discovery must validate unknown candidates before registration and handle invalid
  diagnostics separately.
- Future activation must require an `eligible` record and remain independent from
  registration.

## Status

aceito
