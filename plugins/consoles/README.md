# Console plugin assets

Every console plugin owns its console-specific visual assets. Start from an existing package such as
`game-boy-advance` and keep the same class-first layout:

```text
<plugin>/
├── assets/
│   ├── consoles/<slug>-console-hero.png
│   ├── cartridges/<slug>-cartridge.png
│   ├── blueprints/<slug>-blueprint.png
│   ├── backdrops/<slug>-session-backdrop.png
│   ├── masks/<slug>-cartridge-label-mask.png
│   ├── README.md
│   └── NOTICE.md
├── manifest.json
└── src/index.ts
```

Declare the asset paths in `console.assets`. Do not add console-specific files to
`apps/desktop/assets`, import them from the renderer, or reference another console's asset.
