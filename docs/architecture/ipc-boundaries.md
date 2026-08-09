# IPC boundaries

Electron IPC is a security boundary between the renderer and main process. The
renderer never receives Electron objects, Node.js APIs, arbitrary channels, or
unvalidated data.

## Current public API

The preload bridge exposes a frozen `window.pixelCore` object with one method:

```ts
await window.pixelCore.getHostVersion();
```

`pixel-core:host-version` accepts no request payload and returns exactly:

```ts
{ version: string }
```

The main process rejects payloads on this no-payload channel. Preload validates
the response before returning it to renderer code. The channel name is
allowlisted in `apps/desktop/src/ipc.ts`; renderer code cannot choose a channel
dynamically.

## Rules for future IPC APIs

- Define the channel, request, response, and runtime validators in the IPC
  contract module before wiring Electron handlers.
- Validate request payloads in the main process and responses in preload.
- Use JSON-safe DTOs only. Do not send Electron objects, callbacks, filesystem
  paths with ambient authority, or implementation errors across the boundary.
- Expose a narrow, frozen preload API. Never expose `ipcRenderer`, Node.js, or
  a generic invoke/send function.
- Keep each API capability-oriented and permission-aware. Filesystem access,
  plugin execution, and emulator control require dedicated contracts and
  validation before exposure.
- Treat malformed requests and responses as failures without changing renderer
  or main-process state.

IPC validation does not authorize an operation by itself. Future APIs must also
apply the relevant permission and ownership checks in the main process.
