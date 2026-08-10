# ADR 0020: Emulator session worker

## Status

Accepted.

## Context

Emulation must not block the renderer while Game Boy frames are running. The core also must remain a plugin implementation rather than a dependency of desktop UI or platform runtime packages.

## Decision

The SameBoy plugin owns a Node worker-thread host. The worker loads its packaged WebAssembly module and communicates through a typed message protocol for ROM bytes, normalized input, operation results, and video frames.

## Alternatives considered

- Running the core in a React component was rejected because frame execution would compete with presentation work.
- Running the core directly in Electron main was rejected because one game session could block privileged orchestration.
- Moving SameBoy into `packages/emulator` was rejected because it would reverse the plugin dependency direction.

## Consequences

- The worker is terminated when a session stops and reports failures as typed operation results.
- Frame transfer is independent of the renderer, so the presentation can evolve without core-specific imports.
- Audio and save-related work remain out of scope until their dedicated boundaries exist.
