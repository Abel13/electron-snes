# ADR 0019: ROM session loading

## Status

Accepted.

## Context

The future emulator worker needs ROM bytes after explicit user selection without receiving a filesystem path.

## Decision

Resolve one opaque selection ID only in Electron main, read the selected file with the maximum size
declared by its resolved console plugin, and return copied bytes with safe metadata. Invalid and
unavailable files use structured results. The host also enforces a hard upper bound on declarations.

## Alternatives considered

- Renderer-side reading was rejected because it bypasses Electron boundaries.
- Returning paths to a renderer or worker was rejected because paths are unnecessary after bytes load.
- Loading during selection was rejected because selection and session loading are separate actions.

## Consequences

- ROM bytes are transient and are transferred to a future worker.
- Selection IDs expire when the main process restarts.
