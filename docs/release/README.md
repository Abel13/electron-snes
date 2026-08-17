# Releases

- [Release checklist](checklist.md): required evidence and approval gate for every public build.
- [Package validation](package-validation.md): native-runner package smoke tests and their limits.
- [Desktop updates](../architecture/desktop-updates.md): updater security and channel behavior.
- [Telemetry consent](../architecture/telemetry-consent.md): privacy boundary for release diagnostics.

Public binaries are produced only by `.github/workflows/release.yml` from a version tag on `main`.
Windows, macOS, and Linux downloads are attached to GitHub Releases. The Windows x64 installer is
currently unsigned and may display a Windows SmartScreen warning. Local packages are development
evidence and must never be uploaded as official releases.
