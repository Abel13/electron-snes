# PixelCore Asset Guide

## Purpose

This guide keeps official console illustrations, cartridges, blueprints, and session scenes visually
coherent as the platform expands. It applies to Game Boy Family, Game Boy Advance, NES, SNES,
Nintendo 64, and future official console plugins.

Assets support the product UI. They must not imitate a console manufacturer, game publisher, game
box, logo, character, or exact hardware industrial design.

## Visual direction

- Use a deep navy-to-black spatial base with restrained violet, electric blue, and cyan light.
- Light objects from violet on the left and blue/cyan on the right unless a declared console profile
  requires a different accent balance.
- Prefer technical materials, translucent edges, holographic platforms, blueprint lines, soft bloom,
  subtle orbitals, and sparse particles.
- Keep the game frame and local game cover legible. Effects decorate their surroundings; they never
  alter game pixels or obscure functional controls.
- Use original, brandless silhouettes. A generation may be suggested through proportion and control
  placement, never through copied geometry, labels, or logos.

## Asset classes

| Class              | Purpose                                           | Requirements                                                           |
| ------------------ | ------------------------------------------------- | ---------------------------------------------------------------------- |
| `console-hero`     | Centerpiece in the console selector               | Transparent PNG, original hardware representation, no embedded text    |
| `cartridge`        | Game selection surface                            | Transparent PNG plus a separately declared label mask and safe area    |
| `blueprint`        | Control-configuration diagram                     | SVG or transparent PNG with stable normalized anchor points            |
| `session-backdrop` | Low-emphasis atmosphere around video              | Decorative only; must preserve contrast and reserved HUD space         |
| `cover-mask`       | Places user-provided cover art inside a cartridge | No branding; contains only the label aperture and perspective metadata |

## Source and export rules

- Keep editable source files outside runtime asset folders when possible; commit only reviewed runtime
  exports and their attribution or source record.
- Export runtime raster art as PNG with transparency. Do not flatten it onto a dark background.
- Use at least 2x the largest intended rendered dimension. Keep the object within a 5% transparent
  safety inset so glow and motion do not clip.
- Name files with lowercase kebab case: `<console-id>-<class>.png`, for example
  `game-boy-advance-console-hero.png`.
- Record author, source, license, creation date, and any generation/editing method in the asset
  inventory or adjacent `NOTICE.md`.
- Group runtime files by class under `assets/consoles/`, `assets/cartridges/`,
  `assets/blueprints/`, and `assets/backdrops/`; keep the console slug in every filename.
- Third-party content is allowed only with verified redistribution rights. User-provided game covers
  are local data and are never shipped as PixelCore assets.

## Perspective and cartridge labels

Console hero art may use a deliberate three-quarter perspective. Cartridge label art must be placed
through a declared mask, not hand-tuned CSS for a particular cover.

Each cartridge profile declares:

```ts
type CartridgeLabelProfile = {
  maskAsset: string;
  safeArea: { x: number; y: number; width: number; height: number };
  corners: readonly [
    { x: number; y: number },
    { x: number; y: number },
    { x: number; y: number },
    { x: number; y: number },
  ];
};
```

Coordinates are normalized from `0` to `1` against the cartridge asset. The four corners describe
the visible label plane, allowing a cover to follow a perspective without clipping or stretching the
rest of the cartridge. Cover art uses `object-fit: cover` inside that mask; the user can later choose
crop position without changing the asset.

## Responsive composition

- Hero art scales as one object with its intrinsic aspect ratio; never use independent width and
  height values that deform it.
- Scenes may rearrange ornaments on narrow windows, but the central console, selected title, native
  video frame, and functional controls remain visible.
- Reserve the top-right HUD area for time and battery and the bottom area for input prompts.
- Do not rely on empty black bars to normalize different console video formats. The console visual
  profile composes the surrounding scene around the native frame.
- Reduced motion removes continuous particles, orbital movement, and nonessential depth motion.

## Per-console profile

Every official console provides a declarative profile that references these asset classes and supplies
its video presentation, accent values, and layout intent. It may vary in silhouette, cartridge shape,
frame composition, and proportion while retaining the PixelCore visual direction.

| Console family   | Hero and cartridge intent                                     | Native video     |
| ---------------- | ------------------------------------------------------------- | ---------------- |
| Game Boy Family  | Compact vertical portable and near-square label               | `160x144`        |
| Game Boy Advance | Wide ergonomic portable and wide label                        | `240x160`        |
| NES              | Horizontal home-console composition and cartridge profile     | Console-declared |
| SNES             | Layered 16-bit home-console composition and cartridge profile | Console-declared |
| Nintendo 64      | Spatial 3D composition with broader scene depth               | Console-declared |

Exact display behavior belongs to [Console video presentation](../architecture/console-video-presentation.md).
