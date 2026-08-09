# ADR-0010: Storage Contracts

## Context

PixelCore must keep application configuration, library metadata, cache, plugin data,
user preferences, emulator saves, and save states separate. Generic JSON storage cannot
safely carry binary emulator data, while filesystem paths would leak persistence and
security details into consumers.

## Decision

Retain `JsonStoragePort` for JSON-safe domains and add `BinaryStoragePort` for opaque
binary entries. Binary storage has separate `game-saves` and `save-states` domains and
uses stable opaque keys. Listing exposes only entry metadata; reads, writes, and
removals return asynchronous `Result` values.

No storage technology, directory structure, path, ROM data, encryption, or emulator
implementation is selected by these contracts.

## Alternatives considered

- Store saves in JSON configuration: rejected because binary emulator data does not
  belong in configuration and would blur lifecycle boundaries.
- Use one binary domain for saves and states: rejected because persistence and
  point-in-time snapshots have different retention and capability semantics.
- Expose file paths to adapters or plugins: rejected because paths are implementation
  details and weaken Electron access boundaries.
- Implement a filesystem adapter now: rejected because Electron runtime and explicit
  access policies are separate work.

## Consequences

- Emulator and library work can depend on stable save-data ports without selecting
  persistence infrastructure.
- Future adapters must defensively isolate mutable binary buffers and enforce storage
  security at their I/O boundary.
- Save-state features can remain capability-driven while sharing the same binary
  storage abstraction.

## Status

aceito
