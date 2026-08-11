# Emulator SDK

`@platform/emulator-sdk` defines the public boundary for emulator-core plugins.
An emulator accepts byte buffers already authorized by the host, exposes console-facing
input, emits video and audio frames, and declares optional capabilities.

The SDK has no filesystem paths, Electron APIs, physical device APIs, React state, or
concrete console conditions. `EmulatorRom` is bytes plus a declared extension; host
code owns selection and permission checks before a core receives it.

`EmulatorSession` models loading, start, pause, resume, stop, input updates, and
subscriptions to RGBA video and floating-point audio. Implementations must run outside
the React rendering thread. Save-state, rewind, and fast-forward controls are exposed
only when the declared capabilities allow them.

Save states are opaque core-owned byte buffers tagged with the emulator core ID and a
positive format version. A session that declares `saveStates: true` implements both
`captureSaveState` and `restoreSaveState`; the host validates this relationship after
creating the session and before exposing the capability. Structural plugin validation
never executes `createSession`.

Expected incompatibility or malformed state data returns `invalid-state`. Save-state
storage, slots, autosave, and UI remain host responsibilities and never expose paths to
plugins or renderers.
