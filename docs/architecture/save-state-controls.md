# Save-state controls

The desktop session host coordinates save states without exposing binary payloads or filesystem
paths to the renderer. The renderer can list timestamped slots and request capture or restoration
through validated IPC commands. The host delegates state generation to the active emulator session
and persistence to `SaveStateRepository`.

The pause overlay exposes three manual slots. The reserved `autosave` slot is owned by the autosave
feature and is not written by manual controls. All controls are capability-gated: cores that do not
declare save-state support return `unavailable` and must not expose these actions.
