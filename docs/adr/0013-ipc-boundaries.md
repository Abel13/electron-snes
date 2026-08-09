# ADR 0013: Validate IPC boundaries

## Status

Aceito.

## Context

PixelCore uses Electron with a sandboxed renderer and a minimal preload bridge.
IPC crosses a privilege boundary: renderer input must not gain access to main
process capabilities merely by selecting an arbitrary channel or shaping an
unexpected payload.

## Decision

Define IPC channels and JSON-safe request and response contracts in a dedicated
desktop IPC module. Allowlist channels, validate every request in the main
process, and validate every response in preload before it reaches renderer
code. The initial host-version channel has no payload and exposes only a
version string through a frozen `window.pixelCore` API.

## Alternatives considered

- Expose `ipcRenderer` directly to renderer code. Rejected because it grants
  ambient access to every registered channel.
- Validate only in preload. Rejected because renderer code is untrusted and
  main must enforce its own boundary.
- Add product IPC APIs before their owning domains exist. Rejected because a
  minimal reference contract is safer and avoids speculative privileges.

## Consequences

Every future IPC capability must have an explicit contract, paired runtime
validation, and a narrow preload method. This adds deliberate implementation
work, but preserves Electron security and makes public renderer-facing behavior
testable without launching Electron.
