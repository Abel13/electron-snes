# Product Experience Architecture

## Ownership

Phase 4 keeps product behavior out of React while delivering the complete PixelCore
library and session experience.

- `@platform/library` owns local game metadata, search semantics, favorites, recent
  activity, and opaque ROM and artwork references.
- Electron main owns dialogs, the managed ROM directory, artwork files, persistence,
  and validated IPC handlers.
- Desktop IPC exposes renderer-safe DTOs without paths or ROM bytes.
- `@platform/ui` owns presentational shell, cards, navigation, focus geometry, empty
  states, and session composition.
- `@platform/ui-audio` owns semantic sound tokens, cooldowns, preferences, and silent
  failure behavior.
- The renderer composes services and views; it does not read files, discover plugins,
  or execute emulator work.

## Local library

User-imported `.gb` and `.gbc` files are copied into
`Documents/PixelCore/ROMs`. Users may also place supported files there manually; the
main process reconciles the directory when listing the library. The renderer receives
game IDs and metadata only.

Artwork accepts PNG, JPEG, and WebP up to 5 MiB. The main process stores artwork under
the Electron user-data boundary and returns a validated data URL. The generated
PixelCore default cover remains the fallback when no custom artwork exists.

Favorites and recent timestamps belong to game-library storage. Launching a game
updates recent activity only after the emulator accepts the session.

## Navigation and accessibility

DOM focus remains the authoritative UI focus. Keyboard arrows and normalized gamepad
directions select the nearest visible focusable element in the requested visual
direction. Primary input activates the focused element. Game sessions route input to
the console mapping instead of UI navigation.

Every action remains available to mouse and keyboard. Focus is visible, errors use
live alerts with recovery actions, and decorative particles are hidden when
`prefers-reduced-motion` is enabled.

## Localization

`i18next` and `react-i18next` run only in the renderer. Locale resolution follows
persisted preference, system locale, then `en-US`. The supported locales are `en-US`,
`pt-BR`, and `zh-CN`; Traditional Chinese variants do not alias to Simplified Chinese.

## UI audio and motion

Components request semantic sound tokens. The service resolves runtime assets,
volume, mute, and focus cooldowns. Playback failure never changes interaction results.
Game audio remains owned by the emulator player.

Motion uses transform and opacity transitions. Ambient particles are code-native,
noninteractive, and absent under reduced motion. No continuous decorative animation
is rendered over emulator video.
