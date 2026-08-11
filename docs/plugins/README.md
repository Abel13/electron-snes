# PixelCore plugin development

This directory is the entry point for third-party PixelCore plugin authors.

## Start here

1. Read `sdk-reference.md` to choose the public package for your plugin type.
2. Generate a supported package with `scaffold-cli.md`, or inspect `examples.md`.
3. Follow `creating-a-plugin.md` for manifest, permissions, implementation, and review
   requirements.
4. Run the framework-neutral contract gate documented in
   `../architecture/plugin-contract-runner.md`.
5. Before changing a public contract, follow `api-migration.md`.

## Author-ready plugin types

| Type | SDK | Complete example |
| --- | --- | --- |
| `console` | `@platform/console-sdk` | `plugins/consoles/reference-handheld` |
| `emulator-core` | `@platform/emulator-sdk` | `plugins/emulator-cores/sameboy` |
| `controller` | `@platform/controller-sdk` | `plugins/controllers/reference-gamepad` |
| `game-metadata` | `@platform/game-sdk` | `plugins/games/reference-catalog` |

`theme` and `integration` are reserved manifest categories, but their specialized SDKs
do not yet expose complete definition validators. Do not publish executable definitions
for them until the public contracts and contract-runner registrations exist.

## Non-negotiable boundaries

- Plugins depend on SDKs; PixelCore core packages never depend on concrete plugins.
- Manifests and definitions are untrusted until validation succeeds.
- Contract validity does not grant permissions or activate code.
- Plugins never import Electron, host filesystem paths, core implementations, or another
  concrete plugin.
- ROMs, saves, credentials, proprietary assets, and user data are never fixtures or
  example content.
