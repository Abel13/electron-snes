# Cross-platform package validation

`.github/workflows/package-validation.yml` builds a Windows x64 NSIS installer and unsigned macOS
and Linux smoke packages on native runners whenever release configuration changes.
It is also available through `workflow_dispatch` before a release.

The gate verifies artifact names, minimum size, architecture, packaged ASAR structure, and the
SameBoy WASM runtime. Windows also verifies its NSIS blockmap, updater metadata, and unpacked
executable. macOS and Linux verify GitHub updater metadata; macOS also proves that the executable
is universal.
Successful packages are retained as short-lived workflow artifacts for inspection, but they are not
official downloads and must not be published.

The Windows installer is currently unsigned and may trigger Windows SmartScreen. macOS signing and
notarization are enforced by the tag-triggered release workflow.

Installed application behavior and update-from-previous-version remain manual release gates because CI runners cannot faithfully represent desktop audio, physical controllers, user-owned ROMs, OS security prompts, or a prior public installation. Record those results using the [release checklist](checklist.md).
