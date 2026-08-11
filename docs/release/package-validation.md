# Cross-platform package validation

`.github/workflows/package-validation.yml` builds a real Store-associated Windows package and
unsigned macOS and Linux smoke packages on native runners whenever release configuration changes.
It is also available through `workflow_dispatch` before a release.

The gate verifies artifact names, minimum size, architecture, packaged ASAR structure, and the
SameBoy WASM runtime. Windows additionally verifies every Partner Center identity field. macOS and
Linux verify GitHub updater metadata; macOS also proves that the executable is universal.
Successful packages are retained as short-lived workflow artifacts for inspection, but they are not
official downloads and must not be published.

Microsoft signs Windows after Store certification. macOS signing and notarization are enforced by
the tag-triggered release workflow. The final release requires both workflows and successful Store
certification.

Installed application behavior and update-from-previous-version remain manual release gates because CI runners cannot faithfully represent desktop audio, physical controllers, user-owned ROMs, OS security prompts, or a prior public installation. Record those results using the [release checklist](checklist.md).
