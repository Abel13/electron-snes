# SameBoy emulator-core plugin

This official plugin adapts [SameBoy v1.0.3](https://github.com/LIJI32/SameBoy/tree/v1.0.3) for PixelCore's Game Boy family console plugin.

It accepts user-provided `.gb` and `.gbc` ROMs. It never includes ROMs, saves, save states, or game metadata.

## Build the WebAssembly artifact

Run `pnpm --filter @platform/plugin-emulator-sameboy build:wasm`. The command uses the fixed `emscripten/emsdk:4.0.12` Docker image and writes `wasm/sameboy.wasm`.

The bridge is intentionally limited to ROM buffers, normalized buttons, video frames, and audio setup. Worker scheduling, storage, and renderer presentation belong to their respective platform domains.

## Upstream attribution

SameBoy is Copyright Lior Halphon and contributors and is distributed under the Expat license. The pinned upstream source is tag `v1.0.3`, commit `208ba4afabffab9edde416f2dbb8ae459e34adb8`. Its license is retained in `vendor/SAMEBOY-LICENSE`.
