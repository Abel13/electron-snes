# ADR-0038: Game Boy Advance plugin boundary

## Status

Accepted — console plugin foundation only.

## Context

PixelCore currently supports the Game Boy and Game Boy Color through `.gb`/`.gbc` and SameBoy.
Game Boy Advance uses a different CPU, video system, input surface, ROM format, and emulator core.

## Decision

Represent Game Boy Advance as an independent console plugin with identifier
`org.pixelcore.game-boy-advance`. It declares `.gba`, ten normalized console actions, a `240x160`
wide-portable video profile, and header-based metadata identifiers. The desktop must not expose this
plugin as playable until an audited emulator-core plugin declares compatibility with its identifier.

The GBA console plugin has no filesystem, Electron, renderer, controller-brand, or emulator-core
dependency. Core selection remains a registry concern and must be resolved by compatibility rather
than a console-specific conditional.

## Consequences

- The plugin can be contract-tested and developed independently of emulation.
- `.gba` becomes a valid ROM boundary, but importing a GBA ROM cannot launch the existing SameBoy core.
- A future GBA core requires a separate provenance, license, build, worker, save-format, and capability review.
- The official plugin registry intentionally keeps the GBA unavailable until that compatible core exists.
