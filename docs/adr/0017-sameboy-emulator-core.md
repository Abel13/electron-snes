# ADR 0017: SameBoy emulator-core plugin

## Status

Accepted.

## Context

PixelCore needs its first real emulator core for the Game Boy and Game Boy Color playable-session milestone. The integration must remain portable across desktop platforms and must not couple platform code to a particular emulator implementation.

## Decision

Use SameBoy `v1.0.3`, pinned to commit `208ba4afabffab9edde416f2dbb8ae459e34adb8`, as an official `emulator-core` plugin. Vendor its Expat-licensed core source with attribution and compile a narrow bridge to a portable WebAssembly module using the pinned `emscripten/emsdk:4.0.12` Docker image.

The adapter implements only the public `@platform/emulator-sdk` contract. It accepts ROM bytes, normalized Game Boy actions, and emits RGBA frames. It exposes no filesystem, Electron, renderer, or physical controller API.

## Alternatives considered

- A native SameBoy binary per operating system was rejected because it complicates packaging and creates platform-specific runtime paths.
- A core-specific dependency in `packages/emulator` was rejected because it reverses the required plugin dependency direction.
- A third-party browser wrapper was rejected because its API, build provenance, and compatibility policy would become an uncontrolled public dependency.

## Consequences

- SameBoy updates require an explicit plugin change, provenance review, license review, and regenerated WASM artifact.
- The WebAssembly module stays usable from a dedicated worker; worker scheduling is deliberately implemented by issue `#22`.
- Advanced capabilities remain disabled until their storage and user-experience requirements are implemented.
