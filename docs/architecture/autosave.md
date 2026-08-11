# Autosave

Autosave is a per-game configuration and defaults to enabled. The desktop session host owns the
schedule so checkpointing remains independent of React and emulator implementations.

When enabled, the host captures the active core's opaque state every five minutes and once before a
clean session stop. The state is written to the reserved `autosave` slot through
`SaveStateRepository`. Capture failures do not interrupt gameplay, and cores without save-state
support safely skip the operation. Autosaves never replace cartridge saves or manual slots.
