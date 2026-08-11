# Storage Contracts

## Purpose

PixelCore keeps JSON data, binary game saves, and binary save states behind separate
asynchronous core ports. These contracts select neither a persistence technology nor a
directory layout, and they never expose filesystem paths or handles.

## JSON storage

`JsonStoragePort` stores JSON-safe values in these domains:

- `application-configuration`
- `game-library`
- `cache`
- `plugin-configuration`
- `user-preferences`

It is intended for configuration and metadata only. ROM contents, save files, and save
states never belong in a JSON value or generic application configuration.

## Binary storage

`BinaryStoragePort` stores opaque `Uint8Array` values in two distinct domains:

- `game-saves` for emulator-managed persistent game data.
- `save-states` for point-in-time emulator snapshots.

Callers use stable opaque keys. `list` returns only a key, byte size, and ISO update
timestamp; it does not reveal a path. `read` returns `undefined` when an entry is
absent, while adapter failures use `Result` errors. Implementations must treat byte
arrays as data boundaries and avoid retaining mutable caller buffers.

## Boundaries

The contracts do not define ROM import, encryption, quotas, autosave schedules,
cloud synchronization, save-state capability detection, retention, or filesystem
adapters. Those concerns belong to the emulator, library, Electron security, and
advanced-gameplay work that consumes these ports.
