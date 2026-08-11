# Game playtime

The library owns cumulative `playtimeMilliseconds` for each local game. Existing records migrate
implicitly to zero, and updates accept only non-negative whole milliseconds.

The desktop session host measures elapsed wall-clock time with a monotonic clock. It starts after a
successful library launch, checkpoints every 60 seconds, and flushes before a clean stop. Pauses and
overlays remain part of the session duration, while fast-forward does not multiply playtime because
the tracker is independent from emulator frames and speed.

Ad-hoc ROM sessions without a library game ID are not tracked. Persistence failures do not stop
emulation; a later checkpoint retries elapsed time from the last successful checkpoint.
