# Reference Handheld example

This executable example demonstrates a complete console plugin without representing a
commercial system. It accepts fictional `.demo` cartridges and declares one player
port with left, right, and action controls.

## Structure

- `manifest.json` declares identity, API revision, category, capabilities, and no
  permissions.
- `src/index.ts` uses `defineConsole` and contains only declarative console data.
- `src/contract.test.ts` validates the exported definition with the same public runner
  used by PixelCore CI.

## Validation

From the repository root:

```sh
pnpm --filter @platform/example-console-reference-handheld test
```

The package contains no ROM, emulator, Electron API, filesystem access, brand asset,
or product-specific condition. Copy its shape when starting a console plugin, then
replace the fictional definition with your own validated data.
