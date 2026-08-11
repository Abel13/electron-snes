# Rewind controls

The desktop host exposes emulator capabilities and a validated `setRewindActive(boolean)` command.
The renderer shows and sends rewind input only when the active core declares support.

Rewind is a hold action. Keyboard defaults to `Q`; gamepads default to the left trigger button
(`LT`/`L2`). Press and release transitions are independent from normalized console input, so
changing Game Boy mappings cannot alter platform-level advanced commands. Mouse users can hold the
pause-overlay action. Releasing the command always restores normal execution and audio delivery.
