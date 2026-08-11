# Console-first home

The PixelCore home is a console selector rather than a file or library dashboard. It presents one
system at a time as a focused, gamepad-first showroom and opens the selected system's library only
after confirmation.

## Product catalog and runtime availability

The renderer-safe `ConsoleCatalogItem` combines two independent sources at the desktop composition
root:

- validated console plugin identifiers determine what is playable;
- a declarative product catalog supplies presentation for playable and future systems.

Future systems are not fake plugins. Selecting one provides visible and audible unavailable feedback
without loading code or starting a session. The core never branches on a console identifier.

## Interaction

- Left and right rotate circularly through the catalog.
- Enter, click, touch, or the normalized primary action confirms the centered system.
- The selected system remains the only visible console artwork.
- Game Boy Family opens a library scoped to `.gb` and `.gbc` files.
- The library exposes a persistent action to return to system selection.
- Active game sessions own normalized directional input; the home cannot capture it.

## Motion and access

Direction changes use paired lateral depth transitions. `prefers-reduced-motion` replaces them with
a short crossfade and disables ambient particle movement. Previous, next, and confirm remain native
buttons with visible focus. An `aria-live` region announces the selected system, availability, and
unavailable feedback.

## Assets

Console illustrations are original, brandless product representations. They may suggest a hardware
generation but must not reproduce logos, copyrighted characters, packaging, or exact industrial
designs. Artwork is decorative; system identity and availability are always present as text.
