# Fast-forward controls

The desktop composition root exposes fast-forward only when the active emulator declares the
capability. The renderer sends hold and release edges through a validated boolean IPC command; it
does not control speed, scheduling, or audio behavior.

The initial defaults are `E` on keyboard and `RT/R2` (standard gamepad button `7`). Input is released
before pause or session shutdown so acceleration cannot remain active across lifecycle transitions.
Unsupported cores expose no hint and the emulator controller rejects direct invocation.

Physical advanced-command bindings remain separate from the console's normalized gameplay mapping.
