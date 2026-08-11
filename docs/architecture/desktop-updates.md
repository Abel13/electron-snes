# Desktop updates

PixelCore uses platform-owned update channels. Microsoft Store owns updates for Windows Store
packages. Signed GitHub Releases provide updates for macOS and Linux; the Electron main process is
the only layer allowed to contact that provider, and the renderer receives validated, serialized
state through the preload boundary.

Updates are user-controlled. PixelCore checks only after an explicit request, asks before downloading, and asks again before restarting to install. Development builds report the feature as unavailable. Update failures never interrupt play and remain retryable.

GitHub release assets include macOS and Linux installers, channel metadata, checksums, and build
provenance. The Windows Store submission package remains a protected Actions artifact until Microsoft
certifies and signs it.

## Security boundary

- Renderer code cannot select an update URL or filesystem destination.
- Non-Store update metadata comes from the configured `Abel13/electron-snes` GitHub provider.
- Installation is accepted only after `electron-updater` verifies the signed release artifact.
- An active session is stopped and cartridge data is flushed before installation.
- Production GitHub updates are unavailable when `app.isPackaged` is false or `process.windowsStore`
  is true.
