# Game Boy Advance plugin development

The GBA integration is split into two independently validated plugins:

- `org.pixelcore.game-boy-advance`: console contract, `.gba` boundary, header identification,
  normalized actions, and the `240x160` presentation profile.
- `org.pixelcore.mgba`: emulator-core contract, Worker/WASM execution, video/audio output, and
  declared save capabilities.

## Console plugin

Use `defineConsole` and keep the manifest at `apiVersion: 1`. A console plugin must declare `.gba`,
the ten normalized GBA actions, header identifiers, and native video size `240x160` with
portable-wide orientation and nearest filtering. It must not mention physical controller brands,
keyboard scan codes, or emulator internals.

Its visual assets live under `assets/` in the console plugin. The `console.assets` profile declares
the hero, cartridge, blueprint, session backdrop, and normalized control-diagram points. Do not add
GBA artwork to `apps/desktop/assets` or hardcode GBA paths in the renderer.

## Emulator-core plugin

The core receives ROM bytes and normalized actions through `@platform/emulator-sdk`. It runs in a
Worker and loads the generated WASM runtime from `wasm/`. The reproducible build is:

```text
MGBA_REF=<pinned-mGBA-commit> ./scripts/build-wasm.sh
```

The build requires Docker with the Emscripten image used by the script. Do not commit `.tmp/`
build sources or CMake intermediates. Commit only runtime artifacts required by packaging.

## Saves and capabilities

Cartridge saves are opaque binary data handled by `BinaryStoragePort`; they do not belong in JSON
configuration. The core may expose `cartridge-saves` and `save-states` only when each behavior is
tested. RTC, EEPROM, SRAM, and Flash support must be documented separately for the chosen core.

## Security and compatibility

Third-party plugins use declared permissions, do not access renderer filesystem APIs, and validate
manifests through the official contract runner. Breaking public contracts require a new API version
and a migration note. See [the plugin SDK guide](creating-a-plugin.md) and [the GBA ADR](../adr/0038-game-boy-advance-plugin-boundary.md).
