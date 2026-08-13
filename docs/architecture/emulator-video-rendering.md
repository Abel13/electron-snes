# Emulator video rendering

The UI renders emulator output through `EmulatorVideoCanvas`, a React canvas surface that accepts a width, height, and RGBA pixel buffer. It does not know a console, emulator core, worker, filesystem path, or Electron API.

When a session service supplies frames, the canvas updates its bitmap at the declared native resolution. The canvas never crops, stretches, or changes the original frame. Pixel-art consoles may request pixelated scaling, while a console profile decides the surrounding scene, allowed scaling modes, and responsive placement.

The visual shell intentionally follows the established PixelCore direction: deep spatial background, cyan-magenta energy around the display, clear session status, and calm typography. Input handling, audio, and lifecycle controls remain separate responsibilities. See [Console video presentation](console-video-presentation.md) for the console-owned presentation contract.
