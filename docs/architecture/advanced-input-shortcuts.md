# Advanced input shortcuts

Advanced emulator commands use a separate physical-input layer from normalized console gameplay
actions. Input profile version 4 stores keyboard bindings and per-gamepad binding sets for `rewind`
and `fast-forward`; the profile's console mapping identifies the console scope.

Versions 1 through 3 migrate automatically to `Q`/`E` on keyboard and standard gamepad buttons
`6`/`7` (`LT/L2` and `RT/R2`). Conflicts swap assignments so each supported command remains unique.
Menu/Options button `9` remains reserved for platform navigation and cannot be assigned.

The desktop resolves these bindings only during an active session. The configuration screen lists
only commands declared by the active emulator capabilities, while platform navigation continues to
use its fixed independent controls.
