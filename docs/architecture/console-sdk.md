# Console SDK

`@platform/console-sdk` is the public contract for declarative console plugins.
It defines a console's accepted ROM extensions, generic capabilities, input actions,
and player ports without importing an emulator, controller adapter, Electron API, or
concrete console plugin.

## Authoring

Use `defineConsole` for a strongly typed plugin declaration. A host validates
untrusted data with `validateConsolePlugin` before it is registered or used.

Every definition contains a `manifest` of type `console` and a `console` section.
The console identifier must match the manifest identifier. Input action and player
port IDs are lowercase kebab-case; each player port may reference only actions the
console has declared.

## Game Boy family reference

The first official plugin declares `.gb` and `.gbc`, one player port, and the
console-facing actions `up`, `down`, `left`, `right`, `a`, `b`, `start`, and
`select`. These are a declarative console layout, not physical keyboard or gamepad
inputs. Phase 3 maps physical hardware to normalized actions without changing the
console definition.

The SDK does not load ROMs, start emulators, assign players, access files, or grant
permissions. Those responsibilities remain with the emulator, input, and Electron
boundaries.

The official implementation lives in `plugins/consoles/game-boy-family` and is an
example of a console plugin consuming the SDK without changing platform core code.
