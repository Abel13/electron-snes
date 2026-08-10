# Emulator audio routing

Official emulator plugins emit decoded game audio as renderer-safe PCM frames. A frame contains interleaved `Float32Array` samples, a channel count, and a sample rate. It never contains an emulator instance, ROM data, filesystem path, plugin object, or browser API.

## SameBoy route

The SameBoy bridge receives the core sample callback at 48 kHz, stores stereo PCM in a bounded in-memory ring buffer, converts it to normalized floating-point samples, and transfers it from the worker with video frames. The WebAssembly loader invokes the module's static constructors once before creating a session; this initializes the core's band-limited mixer and is required for non-silent PCM output. When the buffer is full, the newest callback sample is dropped rather than blocking emulation.

The worker session publishes these frames through `EmulatorSession.subscribeAudio`. This boundary lets the desktop composition layer subscribe without importing a concrete core into React.

## Renderer playback

`@platform/ui` provides `EmulatorAudioPlayer`, a renderer-only Web Audio scheduler. It is started from an explicit user gesture, queues contiguous buffers against the `AudioContext` clock, and ignores frames until it is active. It intentionally has no UI-effect sounds, volume preference policy, plugin dependencies, Electron imports, or file access.

Connecting a live desktop session subscription to this player is part of the session lifecycle composition in issue `#25`.

## Compatibility and failure behavior

Audio is optional from an emulator capability perspective. A missing, empty, malformed, or unavailable audio stream must not stop video, input, or lifecycle behavior. The platform can show a visible session warning when a future lifecycle service reports an audio failure; the player itself preserves gameplay interaction by dropping unusable frames.
