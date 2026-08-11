# Desktop updates

PixelCore distributes updates through signed GitHub Releases. The Electron main process is the only layer allowed to contact the update provider; the renderer receives validated, serialized state through the preload boundary.

Updates are user-controlled. PixelCore checks only after an explicit request, asks before downloading, and asks again before restarting to install. Development builds report the feature as unavailable. Update failures never interrupt play and remain retryable.

Release assets include installers, blockmaps, channel metadata, checksums, and build provenance. The beta channel accepts prerelease versions and preserves platform-native signing and notarization requirements.

## Security boundary

- Renderer code cannot select an update URL or filesystem destination.
- Update metadata comes from the configured `Abel13/electron-snes` GitHub provider.
- Installation is accepted only after `electron-updater` verifies the signed release artifact.
- An active session is stopped and cartridge data is flushed before installation.
- Production updates are unavailable when `app.isPackaged` is false.
