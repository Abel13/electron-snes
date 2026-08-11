# ADR 0022: Route emulator audio through PCM frames

## Status

Accepted.

## Context

The first playable Game Boy family session needs audible core output without allowing the UI to import SameBoy, WebAssembly internals, Electron APIs, or user ROM data. Browser autoplay protections also require deliberate audio-context activation.

## Decision

The SameBoy plugin will capture its core callback at 48 kHz into a bounded stereo buffer and publish normalized interleaved PCM frames through the existing `EmulatorSession.subscribeAudio` contract. The renderer-safe UI package owns a Web Audio player that starts only after an explicit user gesture and schedules received frames on the browser audio clock.

## Alternatives considered

- Allow React components to call SameBoy directly: rejected because it violates plugin and renderer boundaries.
- Send a native audio handle across IPC: rejected because it couples the renderer to Electron and cannot represent portable emulator output.
- Buffer audio indefinitely: rejected because unbounded memory can harm active gameplay.

## Consequences

Game audio is a typed transport concern independent of UI sound effects and future volume preferences. Overflow favors responsive emulation over perfect audio continuity. The desktop lifecycle composition must later subscribe to the session and forward frames to the player; this ADR does not create that composition or an audio settings policy.
