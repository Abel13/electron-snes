# ADR 0024: Store local games as metadata and opaque references

## Status

Accepted.

## Context

The playable-session flow needs a user library but ROM contents must not be copied into generic configuration, and filesystem paths must not cross into the renderer.

## Decision

The library runtime stores JSON records in the `game-library` storage domain. Records use a host-only opaque source key rather than ROM bytes or renderer-visible paths. The host injects ID and clock functions, keeping the library portable and testable.

## Alternatives considered

- Store ROM bytes in configuration: rejected because binary game data is not configuration.
- Expose absolute paths to React: rejected because it leaks filesystem capability.
- Put library records in save storage: rejected because game discovery metadata and save data have different lifecycles.

## Consequences

The desktop persistence adapter must safely resolve source keys before loading a ROM. Artwork, metadata enrichment, favorites, recents, and playtime remain later library capabilities.
