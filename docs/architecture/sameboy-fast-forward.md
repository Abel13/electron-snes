# SameBoy fast-forward

The official SameBoy plugin implements fast-forward entirely inside its worker. While the command
is held, each scheduled tick executes two emulator frames and publishes only the final video frame,
providing a fixed `2x` rate without doubling renderer traffic.

Accelerated audio is drained inside the worker and is not forwarded. Releasing the command resumes
normal audio production without queued samples. Fast-forward and rewind are mutually exclusive,
and both states are cleared when a ROM is loaded, the session pauses, or the worker clock stops.

The host interacts only through `setFastForwardActive`; it does not control SameBoy scheduling or
depend on the core's implementation details.
