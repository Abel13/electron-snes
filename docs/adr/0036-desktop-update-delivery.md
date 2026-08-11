# ADR 0036: Desktop update delivery

## Status

Accepted

## Context

PixelCore needs a safe update path for Windows, macOS, and Linux while keeping network and installation privileges outside the renderer.

## Decision

Use `electron-updater` in the Electron main process with GitHub Releases as the provider and a prerelease beta channel. Automatic download and automatic installation are disabled. The renderer can request state transitions only through validated IPC and displays user confirmation points.

Release packaging emits platform metadata and blockmaps alongside signed installers. macOS additionally emits a ZIP because Electron's updater consumes that format while the DMG remains the user-facing download.

## Alternatives

- Browser-only release links were rejected because they provide no integrated update lifecycle.
- Silent updates were rejected because restart and bandwidth usage must remain under user control.
- Renderer-managed downloads were rejected because they would weaken Electron's security boundary.

## Consequences

Release metadata must be published with every version, and signing credentials remain mandatory. Development builds cannot exercise installation, so the final release gate must validate updates between two signed prereleases on every platform.
