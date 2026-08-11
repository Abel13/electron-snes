# Save-state storage

Save states use the existing `save-states` binary domain and never share configuration,
library, ROM, cache, or cartridge-save files. `SaveStateRepository` owns four stable
slots per local game: `autosave`, `slot-1`, `slot-2`, and `slot-3`.

The repository wraps opaque emulator bytes in a small versioned envelope containing the
core ID and core-owned format version. It returns only slot metadata and SDK payloads;
filesystem paths remain private to the desktop adapter.

`BinaryFileStorage` validates opaque keys, limits entries to 16 MiB, uses owner-only file
permissions, serializes writes per entry, and replaces files atomically. Missing entries
are normal optional reads. Malformed envelopes and storage failures return typed errors
without exposing operating-system details.
