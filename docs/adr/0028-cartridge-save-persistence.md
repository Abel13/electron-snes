# ADR 0028: Persist cartridge saves through the host

## Status

Accepted.

## Context

Normal in-game saving modifies battery-backed cartridge RAM. Keeping that data only in an
emulator worker loses user progress when a session or application ends. Letting an
emulator plugin write paths directly would bypass platform storage and permission
boundaries.

## Decision

The emulator SDK carries opaque cartridge-save bytes separately from ROM data and save
states. Emulator sessions may restore bytes after ROM initialization, emit dirty updates,
and include a final payload when stopping. The runtime controller coordinates these
events, while the Electron composition root owns a private atomic file adapter keyed by a
SHA-256 ROM identity.

Periodic dirty flushes reduce loss after an abnormal exit. A final checked flush is
awaited on Stop and Electron `before-quit`. Plugins and renderers never receive save paths.

## Alternatives considered

- Let SameBoy write `.sav` files: rejected because plugins must not receive unrestricted
  filesystem access or host directory knowledge.
- Store save bytes in library JSON: rejected because binary user data has a dedicated
  storage boundary and different integrity requirements.
- Flush only when Stop is clicked: rejected because application or process failure could
  discard substantial progress.
- Implement save states instead: rejected because save states are core-specific snapshots
  and do not replace a game's native save behavior.

## Consequences

The public emulator session contract gains cartridge-save transport without declaring
filesystem semantics. The desktop owns atomic persistence and recovery. SameBoy retains
its native battery and RTC format. Cloud synchronization, save-state snapshots, and a
user-facing import/export workflow remain separate work.
