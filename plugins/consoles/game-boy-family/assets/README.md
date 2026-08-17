# Game Boy Family assets

These files are owned by the Game Boy Family console plugin and are referenced by its declarative
asset profile. The desktop must resolve them through the plugin contract; contributors should not
add console-specific files to `apps/desktop/assets`.

| Class        | File                                         | Purpose                  |
| ------------ | -------------------------------------------- | ------------------------ |
| console hero | `consoles/game-boy-family-console-hero.webp` | Console selector artwork |
| cartridge    | `cartridges/game-boy-family-cartridge.webp`  | Library cartridge shell  |
| blueprint    | `blueprints/game-boy-family-blueprint.png`   | Input mapping diagram    |

The cartridge file is a generic, brandless portable shell retained for backwards compatibility until
a dedicated Game Boy cartridge export is available.
