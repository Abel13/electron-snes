# Emulator session worker

The official SameBoy plugin runs its WebAssembly core in a Node worker thread. The renderer and future React components never import the emulator, execute frames, or read ROM data directly.

## Message boundary

The session host sends typed commands for ROM loading, normalized input, start, pause, resume, and stop. The worker returns a typed operation result and transfers completed `160x144` RGBA video frames. Filesystem access is limited to loading the packaged WASM module inside the plugin worker; it never receives a user-visible ROM path.

## Lifecycle

Starting a loaded session schedules frames at approximately 60 Hz. Pausing clears the scheduler, resuming restores it, and stopping terminates the worker. A worker failure rejects pending operations with an `unexpected` result and marks the session failed.

Video presentation, audio routing, and desktop lifecycle controls remain separate concerns owned by issues `#23`, `#24`, and `#25`.
