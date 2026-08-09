# ADR-0004: Core Contracts

## Context

The platform needs stable contracts for core services before plugin manifests,
registries, permissions, storage adapters, logging sinks, Electron APIs, or runtime
domains are implemented. These contracts must support third-party extensibility without
allowing concrete plugins or platform APIs to enter the core boundary.

## Decision

Publish implementation-free contracts in `@platform/core`, backed by JSON-safe shared
primitives in `@platform/shared`. Expected operational failures use a discriminated
`Result` union. Lifecycle services and event delivery are asynchronous. Registry,
configuration, JSON storage, permission, and logging interfaces are ports that later
issues implement.

JSON storage covers configuration, library metadata, cache, plugin configuration, and
user preferences. Binary save files and save states are deferred to the dedicated
storage issue.

## Alternatives considered

- Exception-first APIs: rejected because expected validation, permission, and I/O
  failures would not be explicit in public signatures.
- Concrete services in the core package: rejected because this would couple contracts
  to persistence, Electron, plugin discovery, or runtime choices.
- A generic unstructured storage bag: rejected because it would blur the required data
  boundaries.
- Binary storage in the first contract set: rejected because it needs dedicated save
  lifecycle and security decisions.

## Consequences

- Consumers must handle `Result` values and JSON-safe payloads explicitly.
- Implementations can change behind stable ports without exposing internal details.
- Future registry, permission, storage, and logging work has a common API boundary.
- New binary storage contracts require a compatibility review and documentation update.

## Status

aceito
