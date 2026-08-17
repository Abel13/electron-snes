# Minimal GBA plugin example

The executable examples are the official source of truth:

- [`plugins/consoles/game-boy-advance`](../../plugins/consoles/game-boy-advance/README.md)
- [`plugins/emulator-cores/mgba`](../../plugins/emulator-cores/mgba/NOTICE.md)
- [`plugins/games/game-boy-advance-catalog`](../../plugins/games/game-boy-advance-catalog/README.md)

Run their contract tests with:

```bash
pnpm --filter @platform/plugin-console-game-boy-advance test
pnpm --filter @platform/plugin-emulator-mgba test
pnpm --filter @platform/example-game-boy-advance-catalog test
```
