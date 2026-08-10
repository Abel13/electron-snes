# ADR 0027: Product experience boundaries

## Status

Aceito.

## Contexto

PixelCore needs a modern library and playable-session interface with search,
favorites, recent games, artwork, localization, controller navigation, motion, and UI
sound. Placing these concerns in one React component would couple presentation to
filesystem, persistence, and emulator runtime behavior.

## Decisão

Keep library state in `@platform/library`, host-only resources behind validated
Electron IPC, reusable presentation in `@platform/ui`, and semantic sound behavior in
`@platform/ui-audio`. Use DOM focus as the shared keyboard, gamepad, and assistive
technology focus model.

Store user ROMs in a managed, visible `Documents/PixelCore/ROMs` directory and expose
only opaque IDs and renderer-safe metadata. Store custom artwork separately under the
application user-data boundary. Implement localization at the renderer boundary with
English as canonical fallback.

Use generated original default artwork and code-native particles. Respect reduced
motion and never make sound or animation the only feedback mechanism.

## Alternativas consideradas

- Keep filesystem paths in React: rejected because it violates the renderer security
  boundary.
- Store ROM bytes in library JSON: rejected because binary user data does not belong
  in metadata storage.
- Implement separate focus state from the DOM: rejected because it would drift from
  keyboard and assistive-technology focus.
- Bind components directly to WAV files: rejected because sound policy and preference
  handling need one service boundary.
- Use game or console artwork as a default: rejected because PixelCore must not ship
  copyrighted game content.

## Consequências

- Library features remain testable without Electron or React.
- Renderer contracts carry no local filesystem paths.
- Users can manage ROMs manually in a predictable directory.
- Official strings can switch locale without restarting the application.
- UI audio and particles can be disabled without affecting gameplay.
- Custom artwork is local user data and must be backed up separately from ROMs.
