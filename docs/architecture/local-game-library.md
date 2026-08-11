# Local game library

`@platform/library` stores a user library as JSON metadata in the `game-library` storage domain. A local game has a display name, `.gb` or `.gbc` extension, stable library ID, added timestamp, and opaque host-only source key. It never contains ROM bytes, save data, save states, artwork bytes, or a filesystem path exposed to the renderer.

The desktop host owns mapping an opaque source key to an approved local file location. A future scan or persistence adapter may change that mapping without changing library records or the UI model. Duplicate opaque source keys are rejected to avoid indexing one local ROM twice.

Each record also owns a versioned `GameConfiguration`. Version 1 contains only
`autosaveEnabled`, which defaults to `true`. Missing configuration on existing records is
migrated in memory to the default and persisted by the next library mutation. Emulator
speed, audio, and input bindings do not belong to this per-game configuration.
