# Emulator video rendering

The UI renders emulator output through `EmulatorVideoCanvas`, a React canvas surface that accepts a width, height, and RGBA pixel buffer. It does not know a console, emulator core, worker, filesystem path, or Electron API.

The initial PixelCore session screen uses the same component in an empty state while no session frame exists. When a future session service supplies frames, the canvas updates its bitmap at the declared native resolution and uses pixelated scaling to preserve Game Boy output.

The visual shell intentionally follows the established PixelCore direction: deep spatial background, cyan-magenta energy around the display, clear session status, and calm typography. Input handling, audio, and lifecycle controls remain separate responsibilities.
