# ADR 0018: ROM file selection boundary

## Status

Accepted.

## Context

PixelCore must let a user choose a local Game Boy ROM without exposing unrestricted filesystem APIs to a renderer or plugin.

## Decision

Use a native Electron open-file dialog in the main process, limited to one `.gb` or `.gbc` file. Return an opaque selection ID with safe display metadata through the preload API. Keep the corresponding absolute path only in an in-memory main-process store.

## Alternatives considered

- Returning an absolute path to the renderer was rejected because it leaks local filesystem information and encourages renderer-side file access.
- Exposing a generic file picker or filesystem API was rejected because the permission scope would be broader than this product action.
- Reading and transferring ROM bytes during selection was rejected because selection and session loading are separate responsibilities.

## Consequences

- A renderer reload or app restart invalidates selections, so a user selects a ROM again before loading it.
- Session loading must resolve IDs only in the main process and revalidate the selected file.
- The boundary remains console-format specific only through declarative supported extensions; plugins do not receive filesystem paths.
