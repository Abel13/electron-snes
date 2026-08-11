# Reference Gamepad example

This executable example maps a fictional standard gamepad to normalized PixelCore
actions. It demonstrates declarative device matching and physical button bindings
without referring to any console layout or controller brand.

## Structure

- `manifest.json` declares a controller plugin with no permissions.
- `src/index.ts` uses `defineController` to map physical button indices to normalized
  actions.
- `src/contract.test.ts` runs the complete public contract gate.

Run from the repository root:

```sh
pnpm --filter @platform/example-controller-reference-gamepad test
```

Runtime discovery, reconnection, player assignment, and console mapping remain host
responsibilities and are intentionally absent from this package.
