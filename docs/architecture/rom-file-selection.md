# ROM file selection

ROM selection is an explicit Electron boundary. The renderer calls `pixelCore.selectRom()` with no arguments. The main process opens the native file dialog with a single-file `.gb` and `.gbc` filter.

## Response contract

Cancellation returns `{ status: 'cancelled' }`. A successful selection returns `{ status: 'selected', rom }`, where `rom` contains an opaque selection ID, file name, and supported extension. It never contains a filesystem path, a file handle, ROM bytes, or a save location.

The main process retains the path in a private in-memory selection store. The next session-loading boundary may resolve that ID only in the privileged process after validating the request. Renderer code, plugins, and the UI do not receive direct filesystem access.

## Scope

This boundary selects exactly one local ROM. It does not read ROM bytes, launch a session, index a library, copy content, or access saves. Those responsibilities remain with the session and library issues.
