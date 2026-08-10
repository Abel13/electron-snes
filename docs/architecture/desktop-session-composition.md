# Desktop session composition

The desktop process resolves the audited official emulator through `@platform/official-plugins`; the desktop package never imports a concrete plugin. `DesktopSessionHost` owns the `EmulatorSessionController`, receives local ROM bytes only in the main process, and sends typed video and audio frames through unidirectional Electron IPC.

The preload validates command responses and incoming frames before exposing a minimal `window.pixelCore` API. The renderer can select, start, pause, resume, and stop a session, but never receives filesystem paths, ROM bytes, Node APIs, or plugin objects. Web Audio starts only from the explicit Select ROM user gesture.
