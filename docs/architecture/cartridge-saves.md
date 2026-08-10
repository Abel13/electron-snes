# Cartridge save persistence

PixelCore treats battery-backed cartridge RAM as normal in-game progress. It is distinct
from a save state: the emulator core produces the same battery RAM and RTC payload that
physical cartridges persist, while save states capture an entire point-in-time emulator
snapshot and remain a later capability.

## Runtime flow

1. The desktop host computes a SHA-256 identity from the local ROM bytes.
2. The host reads an opaque `.sav` payload from its private `game-saves` storage area.
3. `@platform/emulator` passes the payload through the public emulator session contract.
4. SameBoy loads the ROM, initializes its memory controller, and only then imports the
   battery payload.
5. The worker checks SameBoy's battery-dirty signal once per second and emits changed
   bytes without a filesystem path.
6. The desktop adapter serializes writes and atomically replaces the prior `.sav`.
7. Stop and application shutdown request a final export and await persistence.

The renderer receives no ROM bytes, save bytes, storage key, or filesystem path. The
SameBoy plugin receives only opaque bytes and cannot access the user's save directory.

## Storage

Runtime files live below Electron's private user-data directory in
`saves/cartridge/<rom-sha256>.sav`. This is an adapter detail, not a public SDK contract.
The content-derived identity avoids collisions between equally named ROMs and allows a
ROM added manually to find the same save after restart.

Writes use a same-directory temporary file followed by atomic rename. Writes for one ROM
are serialized so a delayed periodic flush cannot replace a newer final flush. Existing
data remains intact if a temporary write fails.

Payloads are limited to 1 MiB, sufficient for supported Game Boy battery RAM and RTC
formats while rejecting unbounded or malformed data. ROMs without battery-backed memory
return no payload and continue normally.

## Compatibility

SameBoy's native buffer format is used so MBC RAM and RTC data remain compatible with
ordinary `.sav` files accepted by the pinned core. PixelCore never bundles, shares, or
synchronizes user saves. A future import/export UI may copy compatible `.sav` files
through an explicit host boundary without exposing unrestricted filesystem access.
