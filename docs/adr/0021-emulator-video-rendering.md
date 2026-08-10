# ADR 0021: Emulator video rendering

## Status

Accepted.

## Context

The first playable session needs a renderer that can display low-resolution RGBA emulator frames without placing emulation work in React.

## Decision

Use a canvas component in `@platform/ui`. It receives only frame data from an external session boundary and writes it with `ImageData`. The desktop renderer is a minimal React/Vite entry point that composes the surface but does not import an emulator plugin.

## Alternatives considered

- Rendering individual pixels as React elements was rejected because it would create unnecessary reconciliation work.
- Letting the SameBoy plugin manipulate the DOM was rejected because it breaks the UI/plugin boundary.
- Deferring all UI until lifecycle work was rejected because a video surface is independently reusable and testable.

## Consequences

- The session service must provide transferred RGBA frames to the UI layer in a later integration.
- Game Boy scaling remains crisp and independent of core-specific presentation code.
- The desktop now has a production renderer build, ready for additional session controls.
