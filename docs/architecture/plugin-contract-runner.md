# Plugin contract runner

## Purpose

`@platform/plugin-test` is the public, pure validation entry point shared by plugin
authors, official examples, scaffold output, and CI. It is test-framework neutral.

## Validation order

`validatePluginContract(input, options?)` parses the manifest, evaluates API
compatibility, preserves incompatible plugins as `inactive`, and only then delegates a
compatible definition to its specialized SDK validator. Specialized failures are
normalized into safe diagnostics.

Complete definitions are supported for `console`, `emulator-core`, `controller`, and
`game-metadata`. A valid `theme` or `integration` manifest receives
`plugin-contract-validator-unavailable` until that SDK publishes a definition contract;
manifest validity alone is never reported as complete contract validity.

```ts
import { validatePluginContract } from '@platform/plugin-test';
import plugin from './definition.js';

const result = validatePluginContract(plugin);
if (result.status !== 'valid') throw new Error(JSON.stringify(result));
```

The runner accepts an already imported `unknown` value. It never resolves paths, reads
files, imports modules, activates code, grants permissions, or mutates a registry.
