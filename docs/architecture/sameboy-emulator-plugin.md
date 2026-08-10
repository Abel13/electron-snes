# SameBoy emulator plugin

The official SameBoy plugin is PixelCore's first emulator-core integration. It targets the Game Boy family console plugin and accepts local `.gb` and `.gbc` ROM buffers.

## Boundary

`@platform/plugin-emulator-sameboy` depends only on `@platform/emulator-sdk`. The desktop app and runtime packages discover it through future registry and session boundaries; they never import SameBoy-specific APIs.

The bridge exposes ROM loading, normalized Game Boy buttons, a 160x144 RGBA video frame, and audio configuration. It does not receive filesystem paths, Electron APIs, physical-device APIs, or user data directories.

## Capabilities

The initial declaration sets `saveStates`, `rewind`, and `fastForward` to `false`. Those features must be enabled only by their dedicated capability and storage work, even where the upstream core can support them.

## Build and licensing

The plugin vendors the source for SameBoy `v1.0.3` at commit `208ba4afabffab9edde416f2dbb8ae459e34adb8`, licensed under Expat. It also embeds SameBoy's Expat-licensed fast CGB boot ROM as a generated C header, with attribution in `NOTICE.md`. This establishes the CGB post-boot state without requiring or distributing proprietary firmware. `scripts/build-wasm.sh` compiles a checked-in runtime artifact with the pinned `emscripten/emsdk:4.0.12` Docker image. The build explicitly invokes static constructors when the module is instantiated so SameBoy's band-limited audio mixer is initialized. This produces one WebAssembly binary for all desktop targets.

The platform ships no commercial ROMs, proprietary boot ROMs, saves, or save states. User ROMs are introduced only through the explicit file-selection boundary in issue `#20`.
