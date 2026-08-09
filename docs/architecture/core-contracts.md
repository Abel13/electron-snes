# Core Contracts

## Purpose

`@platform/core` defines stable ports and small infrastructure-only implementations for
platform services. It depends only on `@platform/shared` and never imports a plugin,
console, emulator, controller, game, UI, Electron API, or filesystem API.

## Shared boundary

`@platform/shared` exposes JSON-safe primitives: `JsonPrimitive`, `JsonArray`,
`JsonObject`, `JsonRecord`, and `JsonValue`. Public core payloads, metadata, logging
context, configuration, and JSON storage use these primitives rather than runtime
objects, classes, dates, or filesystem handles.

Timestamps are ISO 8601 strings. Contract consumers must treat all metadata and JSON
objects as readonly.

## Result and errors

Expected operational failures use the discriminated `Result<T, E>` union:

```ts
const result = await registry.resolve('plugin.example');

if (!result.ok) {
  console.error(result.error.code);
  return;
}

const entry = result.value;
```

`CoreError` has a stable machine-readable `code`, a human-readable `message`, and
optional JSON-safe `details`. Initial codes cover invalid input, missing resources,
conflicts, denied permissions, unavailable services, event delivery, and unexpected
failures. Do not use exceptions for failures represented by `Result`.

## Service lifecycle and events

`LifecycleService` models generic core services with `idle`, `starting`, `running`,
`stopping`, `stopped`, and `failed` states. It does not model an emulator or game
session.

`EventBus<TEventMap>` publishes typed JSON-safe event envelopes asynchronously.
Events have a type, payload, and ISO timestamp. Subscriptions return an unsubscribe
function; concrete delivery, buffering, retries, and telemetry are not part of this
contract.

## Registry, configuration, and storage

`Registry<T>` defines asynchronous registration, resolution, listing, and removal of
identified entries. `InMemoryRegistry<T>` is its deterministic, non-persistent core
implementation: duplicate identifiers return `conflict`, absent entries return
`not-found`, and listings sort by identifier. Plugin-specific registration belongs to
`@platform/plugin-sdk`; filesystem discovery remains outside this boundary.

`ConfigurationStore` provides namespaced JSON values. `JsonStoragePort` separates
JSON storage into application configuration, game library, cache, plugin configuration,
and user preference domains. `BinaryStoragePort` separately handles opaque binary
entries for game saves and save states, exposing only a domain, key, bytes, size, and
ISO update timestamp. Neither contract selects a persistence technology or exposes
paths. See `storage-contracts.md`.

## Permissions and logging

`PermissionRequest` declares a named resource, explicit `read`, `write`, `list`, or
`execute` actions, and an optional rationale. `PermissionResourceDefinition` describes
the host-mediated resource and its allowed actions; `PermissionGrant` records the
explicit subset granted to a plugin. `assessPermissionRequest` is pure and default-deny:
unknown resources are unavailable, incomplete grants are denied, and no manifest
request grants authority on its own. See `plugin-permissions.md`.

`Logger` accepts structured entries with level, message, ISO timestamp, and optional
JSON context. Log destinations, redaction, retention, and diagnostics belong to issue
`#11`.

## Rules for consumers

- Depend on ports, not implementations.
- Preserve `Result` failures instead of converting expected conditions into exceptions.
- Keep contract payloads JSON-safe and readonly.
- Do not add console, plugin, Electron, filesystem, or renderer assumptions.
- Add a new public contract only with documentation, tests, compatibility review, and
  an ADR when it has long-term architectural impact.
