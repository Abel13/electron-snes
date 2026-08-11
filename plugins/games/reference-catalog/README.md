# Reference Game Catalog example

This executable example publishes original metadata for the fictional `Orbit Demo`.
It demonstrates localized text, a safe package-relative cover reference, console
association, source attribution, and license information.

The included SVG and copy are original PixelCore reference material released under
CC0-1.0 for use in plugin tests and examples. The package contains no ROM, ROM hash,
commercial game data, downloaded artwork, or runtime network code.

Run from the repository root:

```sh
pnpm --filter @platform/example-game-reference-catalog test
```

The host library remains responsible for matching metadata to user-owned games,
persisting overrides, and resolving conflicts between providers.
