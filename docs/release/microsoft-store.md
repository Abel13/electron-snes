# Microsoft Store submission

Windows distribution uses the Microsoft Store so Microsoft certifies and signs the package. The
unsigned Store submission artifact is produced by the native Windows release job and must never be
published as a direct GitHub download.

## Product identity

The AppX manifest must exactly match the currently authorized Partner Center identity:

| Manifest field | Partner Center value |
| --- | --- |
| `Identity.Name` | `42548abeldutra.PixelCore` |
| `Identity.Publisher` | `CN=2E06CDBC-D3D8-4686-8A98-B5E634031252` |
| `Properties.PublisherDisplayName` | `Abel Dutra UI` |

If Partner Center approves a new publisher display name, update the builder configuration,
validation workflow, this record, and package evidence together before submission. Never change
only the manifest.

## Submission flow

1. Run the tag-triggered release workflow from a commit on `main`.
2. Download `pixelcore-windows-store-submission` from the successful workflow run.
3. Upload the contained `.appx` under the PixelCore product's Packages section.
4. Complete pricing, properties, age ratings, Store listings, certification notes, and submission
   options. Classify PixelCore as an Entertainment app/emulator, not a game, and state that it
   does not include ROMs or commercial game content.
5. Submit for certification and wait until the product is available in the Store.
6. Set `MICROSOFT_STORE_URL` to `https://apps.microsoft.com/detail/9P76TZ83Q994` in the protected
   `release` environment before the GitHub release publish job runs.
7. Verify installation and updates from the Store on a clean Windows device.

The Microsoft Store owns Windows installation, signing, and updates. PixelCore's GitHub updater is
disabled in Windows Store packages. GitHub Releases remain the update channel for macOS and Linux.
