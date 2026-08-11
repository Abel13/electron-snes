# Releases

- [Release checklist](checklist.md): required evidence and approval gate for every public build.
- [Desktop updates](../architecture/desktop-updates.md): updater security and channel behavior.
- [Telemetry consent](../architecture/telemetry-consent.md): privacy boundary for release diagnostics.

Public binaries are produced only by `.github/workflows/release.yml` from a version tag on `main`. Local packages are development evidence and must never be uploaded as official releases.
