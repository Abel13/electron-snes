# ADR 0026: Universal input runtime

## Status

Accepted.

## Context

PixelCore must let keyboard and generic gamepads control an official console without
teaching emulator cores about browser APIs, controller brands, or physical layouts.
Mappings and device preferences must survive application restarts, while disconnection
must never leave a button stuck or corrupt an active session.

## Decision

Place hardware adapters, normalized actions, discovery, assignment, mapping, and input
profiles in `@platform/input`. Adapters translate keyboard codes and the standard Gamepad
API layout into platform actions. Console plugins provide declarative version 1 mappings
from those actions to console action IDs.

The renderer polls hardware and sends only mapped console-action snapshots through a
validated preload API. The desktop session host forwards snapshots to the active
emulator session. Every snapshot represents complete pressed state, so absent actions
are released.

Persist profiles through `JsonStoragePort` in the `user-preferences` domain. Store stable
device fingerprints and reconcile them against transient connected-device IDs. A
disconnect produces an empty snapshot and reconnection restores the prior assignment.

## Alternatives considered

- Passing keyboard or Gamepad objects to emulator plugins was rejected because it leaks
  hardware and browser APIs across the plugin boundary.
- Hard-coding Game Boy controls in the input runtime was rejected because console
  mappings belong to console plugins.
- Persisting profiles in emulator or save storage was rejected because input preferences
  have a distinct lifecycle and data boundary.
- Keeping the last input during disconnect was rejected because it can leave controls
  stuck in an active session.

## Consequences

- Controller plugins can later provide declarative physical profiles without changing
  emulator cores.
- The temporary Phase 3 settings surface is accessible but deliberately defers final
  visual design and localization to Phase 4.
- Input polling remains in the renderer and does not place high-frequency state in React.
