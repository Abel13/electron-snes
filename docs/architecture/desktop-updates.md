# Desktop updates

PixelCore uses signed GitHub Releases for macOS and Linux updates; the Electron main process is the
only layer allowed to contact that provider, and the renderer receives validated, serialized state
through the preload boundary. Windows releases are distributed as an unsigned NSIS installer and
must be downloaded manually until code signing is introduced.

Updates are user-controlled. PixelCore checks only after an explicit request, asks before downloading, and asks again before restarting to install. Development builds report the feature as unavailable. Update failures never interrupt play and remain retryable.

GitHub release assets include Windows, macOS, and Linux installers, channel metadata, checksums,
and build provenance. Windows update metadata is retained with the installer for the future signed
update channel, but the application does not use it while the installer is unsigned.

## Security boundary

- Renderer code cannot select an update URL or filesystem destination.
- Update metadata comes from the configured `Abel13/electron-snes` GitHub provider.
- Installation is accepted only after `electron-updater` verifies the signed release artifact.
- An active session is stopped and cartridge data is flushed before installation.
- Production GitHub updates are unavailable when `app.isPackaged` is false or on Windows while its
  installer remains unsigned.
