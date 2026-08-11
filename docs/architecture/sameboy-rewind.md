# SameBoy rewind

The official SameBoy plugin implements the optional rewind capability entirely inside its worker.
It retains a fixed ring of BESS states covering approximately ten seconds at the core frame rate.

While rewind is held, the worker restores prior states, publishes the restored video frames, and
drains audio without forwarding it. Releasing rewind resumes normal frame production immediately.
History is cleared whenever a ROM is loaded and never crosses sessions, games, or plugin boundaries.
The host interacts only through `setRewindActive`; it cannot inspect the ring or BESS payloads.
