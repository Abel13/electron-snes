# Orbit Pocket console plugin example

This executable example shows the complete public structure of a console plugin. Orbit
Pocket and `.orbit` files are fictional; the package contains no ROM, emulator,
commercial identifier, Electron API, or filesystem permission.

## Structure

```text
manifest.json       Plugin identity, API revision, type, capabilities, and permissions
src/index.ts        Typed console definition created with defineConsole
src/index.test.ts   Public contract and manifest-alignment tests
```

The definition declares one player port, console-facing actions, normalized platform
mappings, capabilities, and supported extensions. A real plugin should replace the
identity and console data while preserving the separation between physical controllers,
console actions, and emulator implementation.

From the repository root, run:

```sh
pnpm --filter @platform-example/console-plugin test
pnpm --filter @platform-example/console-plugin typecheck
```

The test uses `@platform/plugin-test`, the same runner intended for official CI and
community plugins. A passing contract does not install, activate, or authorize a plugin.
