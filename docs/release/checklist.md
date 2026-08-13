# PixelCore release checklist

Use this checklist for every public release. A release is approved only when every required item has an attached GitHub Actions run, artifact, or reviewer record. Never bypass a failed check by uploading a locally built replacement.

## 1. Prepare

- [ ] The release commit is on `main` and originated from `develop` through the documented Git Flow.
- [ ] `apps/desktop/package.json` contains the intended SemVer version.
- [ ] The tag is exactly `v<package-version>` and points to the release commit on `main`.
- [ ] All milestone issues are closed or explicitly moved to a later milestone with rationale.
- [ ] User-facing changes and known limitations are present in the generated release notes.
- [ ] No ROM, save, save state, local artwork, credential, signing certificate, or private test fixture is tracked.

## 2. Validate source

- [ ] Foundation validation passes on Windows, macOS, and Linux.
- [ ] Official plugin validation passes.
- [ ] `format:check`, `lint`, `typecheck`, `test`, and `build` pass from the lockfile.
- [ ] Plugin manifests, API compatibility, permissions, and critical input navigation remain valid.
- [ ] Telemetry is absent or remains disabled unless explicit consent is `granted`.

## 3. Validate credentials

- [ ] The Windows AppX identity exactly matches the reserved Partner Center product.
- [ ] The `MICROSOFT_STORE_URL` environment variable is `https://apps.microsoft.com/detail/9P76TZ83Q994`.
- [ ] macOS Developer ID and App Store Connect API secrets are available only to the protected `release` environment.
- [ ] The environment requires an authorized reviewer and does not expose secrets to pull requests.
- [ ] No secret value appears in logs, artifacts, source files, release notes, or checksums.

## 4. Validate artifacts

Expected user downloads:

- [ ] Windows link opens the certified PixelCore Microsoft Store listing.
- [ ] `PixelCore-<version>-macOS-universal.dmg`
- [ ] `PixelCore-<version>-Linux-x86_64.AppImage`

Expected update and verification assets:

- [ ] Protected workflow artifact contains `PixelCore-<version>-Windows-Store-x64.appx`.
- [ ] macOS universal ZIP, ZIP blockmap, DMG blockmap, and `beta-mac.yml`.
- [ ] Linux `beta-linux.yml` with the embedded AppImage blockmap.
- [ ] `SHA256SUMS` covers every published release asset except itself.
- [ ] GitHub build provenance attestation covers every published artifact.
- [ ] Artifact names and metadata URLs contain the same version as the tag.

Platform trust checks:

- [ ] Partner Center certification succeeds and Microsoft signs the Windows package.
- [ ] macOS app signature passes `codesign --verify --deep --strict`.
- [ ] macOS notarization ticket passes `xcrun stapler validate` and Gatekeeper assessment.
- [ ] macOS executable contains both `arm64` and `x86_64` slices.
- [ ] Linux AppImage is executable and reports ELF x86-64.

## 5. Smoke test installed applications

Run from the installed artifact, not the development server:

- [ ] Application starts once, displays the branded startup, and reaches console selection.
- [ ] Keyboard navigation works without an initial mouse click.
- [ ] A connected controller can navigate, select Game Boy Family, and control a session.
- [ ] A user-owned `.gb` or `.gbc` ROM imports into the managed ROM directory and launches.
- [ ] Video, audio, pause, resume, exit, cartridge save, autosave, save state, rewind, and fast-forward work when supported.
- [ ] Closing the application ends all PixelCore processes.
- [ ] Global preferences and input profiles survive restart.
- [ ] No ROM, save, path, or private metadata appears in diagnostics or network traffic.

## 6. Verify update path

- [ ] Install the previous release from its platform-owned channel.
- [ ] Check for updates from global settings on macOS/Linux and through Microsoft Store on Windows.
- [ ] Confirm that download does not begin before user approval.
- [ ] Download the candidate and confirm restart separately.
- [ ] Confirm the updated version starts, preserves user data, and remains signed/notarized.
- [ ] Confirm declining or postponing an update does not interrupt gameplay.

## 7. Publish and monitor

- [ ] The workflow-created GitHub release is marked prerelease for beta versions.
- [ ] GitHub exposes macOS and Linux downloads plus a public Windows Microsoft Store link.
- [ ] Release notes include supported OS/architecture, installation notes, known limitations, and ROM ownership policy.
- [ ] Downloaded files match `SHA256SUMS` from a clean machine.
- [ ] A release owner and rollback owner are recorded in the release issue.

## 8. Rollback

- [ ] Preserve the previous signed release and update metadata until the candidate is approved.
- [ ] If startup, signing, data integrity, or update validation fails, stop promotion and mark the release as affected.
- [ ] Do not delete evidence. Document the failure and create a focused fix issue.
- [ ] Restore the previous channel metadata only through the protected release workflow.
- [ ] Publish a corrected, incremented version; never replace immutable artifacts under an existing tag.

## Approval record

Record the release tag, workflow run URL, smoke-test platforms, approver, rollback owner, known limitations, and final GitHub release URL in the Phase 7 tracking issue.
