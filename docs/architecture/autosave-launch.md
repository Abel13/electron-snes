# Autosave launch choice

Library launches negotiate autosave restoration before starting an emulator session. When a valid
autosave belongs to the active core and save-state capability is available, the host returns only a
renderer-safe timestamp. The user then explicitly chooses restoration or a fresh launch.

Starting normally never removes or rewrites the existing autosave. Restoration occurs through the
generic emulator save-state capability after ROM launch; unsupported cores never expose the choice.
