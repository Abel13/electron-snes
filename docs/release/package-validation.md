# Cross-platform package validation

`.github/workflows/package-validation.yml` builds real, unsigned smoke packages on native Windows, macOS, and Linux runners whenever release configuration changes. It is also available through `workflow_dispatch` before a release.

The gate verifies public artifact names, minimum size, architecture, updater metadata, blockmaps, packaged ASAR structure, and the unpacked SameBoy WASM runtime. macOS validation additionally proves that the application executable is universal. Successful packages are retained as short-lived workflow artifacts for inspection, but they are not official downloads and must not be published.

Code signing and notarization are intentionally enforced by the tag-triggered release workflow instead. The final release requires both workflows: package smoke proves reproducibility without secrets, while release validation proves platform trust with protected credentials.

Installed application behavior and update-from-previous-version remain manual release gates because CI runners cannot faithfully represent desktop audio, physical controllers, user-owned ROMs, OS security prompts, or a prior public installation. Record those results using the [release checklist](checklist.md).
