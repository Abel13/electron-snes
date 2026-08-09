# Game Boy Family Console Plugin

The official PixelCore Game Boy + Game Boy Color console plugin declares `.gb` and
`.gbc` compatibility, one player port, and the console actions `up`, `down`, `left`,
`right`, `a`, `b`, `start`, and `select`.

It is declarative and contains no ROM, emulator implementation, filesystem access,
or input-device code. The emulator-core and input plugins consume this contract through
their respective SDKs.
