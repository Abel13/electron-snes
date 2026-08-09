# Electron Security

## Runtime baseline

The desktop shell enables Electron sandboxing before startup and creates windows with:

- `contextIsolation: true`
- `nodeIntegration: false`
- `sandbox: true`
- `webSecurity: true`
- `allowRunningInsecureContent: false`

The preload exposes a frozen `pixelCore` API with narrowly typed methods. It does
not expose Node.js, Electron, filesystem, IPC primitives, plugins, or application
services to the renderer. IPC contracts are defined in
[IPC boundaries](ipc-boundaries.md).

## Navigation boundary

The shell denies all `window.open` attempts and prevents navigation. It starts at
`about:blank` until a later renderer-delivery issue establishes a trusted local origin
and content security policy.

## Future work

File selection, plugin execution, and filesystem access remain outside this
baseline. They must extend the preload through narrowly typed, validated contracts
rather than exposing Electron primitives.
