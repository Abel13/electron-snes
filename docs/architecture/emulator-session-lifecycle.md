# Emulator session lifecycle

`@platform/emulator` owns `EmulatorSessionController`, the domain coordinator for one injected `EmulatorPluginDefinition`. It is deliberately not a plugin loader, Electron API, filesystem adapter, or React hook.

## Launch sequence

The controller creates one session, subscribes to its renderer-safe video and audio outputs, loads the provided ROM bytes, then starts emulation. A load or start failure stops the temporary session, removes output subscriptions, and returns the original typed emulator failure.

The controller exposes pause, resume, and stop only for an active session. A successful stop unsubscribes outputs and releases the controller for another launch. A session creation exception becomes a stable `unexpected` operation result without leaking the exception.

## Output isolation

Video and audio callbacks are injected by the host composition layer. An output callback failure is ignored so a presentation issue cannot halt gameplay. The desktop host is responsible for selecting an eligible plugin and later adapting these callbacks to renderer IPC; React never imports an emulator plugin or lifecycle implementation.
