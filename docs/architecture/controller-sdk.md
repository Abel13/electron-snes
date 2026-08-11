# Controller SDK

## Purpose

`@platform/controller-sdk` is the public boundary for declarative controller plugins.
It describes how a physical device is recognized and how its inputs become normalized
platform actions. It never describes a console layout or emulator input.

## Public contract

Use `defineController` for typed declarations and `validateControllerPlugin` at an
untrusted boundary. A definition contains:

- a controller ID equal to the manifest ID;
- one or more declarative device match criteria;
- unique physical button or directional-axis inputs;
- unique normalized action identifiers.

Buttons use indices from `0` through `63`. Axes use indices from `0` through `15`, a
positive or negative direction, and an optional threshold from `0.1` through `1`.
Matching may use lowercase USB vendor/product IDs, name fragments, and the standard
Gamepad mapping flag. It does not grant device access.

```ts
import { defineController } from '@platform/controller-sdk';

export default defineController({
  manifest,
  controller: {
    id: manifest.id,
    match: [{ nameIncludes: ['generic'], standardMapping: true }],
    mappings: [
      { input: { kind: 'button', index: 0 }, normalizedAction: 'primary' },
      {
        input: { kind: 'axis', index: 0, direction: 'negative', threshold: 0.65 },
        normalizedAction: 'move-left',
      },
    ],
  },
});
```

## Boundaries

- Plugins depend on `@platform/controller-sdk`; the runtime input package does not
  import concrete controller plugins.
- Normalized actions are stable identifiers. Console plugins independently map them to
  console actions.
- Device discovery, player assignment, reconnection, polling, and permissions remain
  runtime responsibilities.
- Definitions contain no Electron APIs, filesystem paths, executable matchers, brands,
  console IDs, or emulator details.

Validation is pure and returns discriminated results with safe diagnostics. Activation,
discovery, and input execution remain outside the SDK.
