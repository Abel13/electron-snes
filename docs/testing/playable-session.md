# Playable session testing

Automated Phase 2 coverage uses small synthetic, redistributable bytes. They test
supported `.gb` and `.gbc` selection, safe loading, session lifecycle, normalized input,
video/audio frame forwarding, battery RAM export/import, atomic save persistence, and
shutdown without including a commercial ROM.

## Private compatibility check

A lawful owner may manually select their private compatible `.gb` or `.gbc` copy, launch
it, create an in-game save, stop PixelCore, restart the application, and verify that the
game offers the restored progress. Pause/resume, video, audio, and controls should remain
functional. Do not commit, upload, download, or attach the ROM, save, or save-state files.
Record only non-sensitive observations such as platform version, extension, and visible
behavior.

## Data separation

ROM bytes are loaded only for a session. Library metadata uses opaque local references. Save files and save states remain in their dedicated binary storage domains and are never stored in generic configuration or test fixtures.
