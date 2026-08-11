# Emulator session lifecycle

`@platform/emulator` owns `EmulatorSessionController`, the domain coordinator for one injected `EmulatorPluginDefinition`. It is deliberately not a plugin loader, Electron API, filesystem adapter, or React hook.

## Launch sequence

The controller creates one session, subscribes to its renderer-safe video, audio, and
cartridge-save outputs, loads the provided ROM bytes and optional battery payload, then
starts emulation. A load or start failure stops the temporary session, removes output
subscriptions, and returns the original typed emulator failure.

The controller exposes normalized input, pause, resume, and stop only for an active
session. Stop awaits the host's final cartridge-save persistence before releasing the
session. A session creation exception becomes a stable `unexpected` operation result
without leaking the exception.

## Output isolation

Video, audio, and cartridge-save callbacks are injected by the host composition layer.
Presentation callback failures cannot halt gameplay. Periodic save failures are retried by
the final checked flush, which reports failure rather than silently claiming a clean stop.
The desktop host is responsible for selecting an eligible plugin, adapting renderer-safe
outputs to IPC, and persisting save bytes; React never imports an emulator plugin or
lifecycle implementation. See `cartridge-saves.md`.
