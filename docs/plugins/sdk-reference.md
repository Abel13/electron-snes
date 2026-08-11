# Plugin SDK reference

## Common plugin SDK

`@platform/plugin-sdk` owns contracts shared by every plugin:

| Export | Purpose |
| --- | --- |
| `PluginManifestSchema` | Canonical strict manifest v1 schema. |
| `validatePluginManifest` | Structural and API-compatibility validation of `unknown`. |
| `assessPluginApiCompatibility` | Pure comparison with an inclusive host range. |
| `PluginRegistry` | In-memory storage for already validated eligible or inactive manifests. |
| `CURRENT_PLUGIN_API_VERSION` | Current authoring revision, presently `1`. |

Every manifest requires `id`, `name`, semantic `version`, integer `apiVersion`, `type`,
non-empty unique `capabilities`, and a `permissions` array. Unknown fields are rejected,
except documented additive schema fields such as optional localization.

Manifest validation has three outcomes: `valid` definitions are eligible for specialized
validation, `inactive` definitions use an unsupported API revision, and `invalid`
definitions contain safe structural diagnostics. Neither `valid` nor `inactive`
executes plugin code.

## Console SDK

`@platform/console-sdk` exports `defineConsole` and `validateConsolePlugin`. A console
definition declares capabilities, accepted ROM extensions, console-local actions,
player ports, and normalized input mappings.

Minimal declaration:

```ts
import { defineConsole } from '@platform/console-sdk';

export const plugin = defineConsole({
  manifest: {
    id: 'org.example.handheld', name: 'Example Handheld', version: '1.0.0',
    apiVersion: 1, type: 'console', capabilities: ['cartridge-playback'], permissions: [],
  },
  console: {
    id: 'org.example.handheld',
    capabilities: ['cartridge-playback'],
    supportedRomExtensions: ['.demo'],
    inputActions: [{ id: 'action' }],
    playerPorts: [{ id: 'player-one', inputActions: ['action'] }],
    inputMapping: {
      version: 1,
      playerPortId: 'player-one',
      entries: [{ normalizedAction: 'primary', consoleAction: 'action' }],
    },
  },
});
```

Full rules are in `../architecture/console-sdk.md`; the complete executable example is
`plugins/consoles/reference-handheld`.

## Emulator SDK

`@platform/emulator-sdk` exports `defineEmulator` and `validateEmulatorPlugin`. An
emulator-core definition declares compatible console IDs, ROM extensions, capabilities,
and a session factory implementing lifecycle, video, audio, input, and cartridge-save
ports.

Emulator code is executable and must run outside React's render thread. Capability
flags are authoritative: hosts must not infer save states, rewind, or fast-forward from
the emulator name. See `../architecture/emulator-sdk.md` and the official
`plugins/emulator-cores/sameboy` adapter.

## Controller SDK

`@platform/controller-sdk` exports `defineController` and
`validateControllerPlugin`. Definitions contain declarative device match criteria and
unique physical button or directional-axis mappings to normalized actions.

Minimal declaration:

```ts
import { defineController } from '@platform/controller-sdk';

export const plugin = defineController({
  manifest: {
    id: 'org.example.pad', name: 'Example Pad', version: '1.0.0',
    apiVersion: 1, type: 'controller', capabilities: ['gamepad-mapping'], permissions: [],
  },
  controller: {
    id: 'org.example.pad',
    match: [{ standardMapping: true }],
    mappings: [{ input: { kind: 'button', index: 0 }, normalizedAction: 'primary' }],
  },
});
```

Controllers never map directly to console-local buttons. See
`../architecture/controller-sdk.md` and `plugins/controllers/reference-gamepad`.

## Game metadata SDK

`@platform/game-sdk` exports `defineGameMetadata` and
`validateGameMetadataPlugin`. Static records declare a console ID, stable provider-owned
record ID, localized text including the provider default locale, provenance, and
optional safe package-relative artwork.

Minimal declaration:

```ts
import { defineGameMetadata } from '@platform/game-sdk';

export const plugin = defineGameMetadata({
  manifest: {
    id: 'org.example.catalog', name: 'Example Catalog', version: '1.0.0',
    apiVersion: 1, type: 'game-metadata',
    capabilities: ['localized-game-metadata'], permissions: [],
  },
  metadata: {
    id: 'org.example.catalog',
    defaultLocale: 'en-US',
    records: [{
      id: 'example-game',
      consoleId: 'org.example.handheld',
      text: { 'en-US': { title: 'Example Game' } },
      provenance: { source: 'Example author', license: 'CC0-1.0' },
    }],
  },
});
```

Providers do not inspect ROM content or fetch remote artwork through this contract. See
`../architecture/game-metadata-sdk.md` and `plugins/games/reference-catalog`.

## Contract tooling

`@platform/plugin-test` exports `validatePluginContract`, the single complete gate for
manifests, API compatibility, and specialized definitions. A contract test is:

```ts
import { expect, test } from 'vitest';
import { validatePluginContract } from '@platform/plugin-test';
import { plugin } from './index.js';

test('satisfies the public plugin contract', () => {
  expect(validatePluginContract(plugin).status).toBe('valid');
});
```

`@platform/plugin-cli` generates this structure for author-ready declarative types. It
does not install dependencies, overwrite directories, or activate plugins.

## Validation and compatibility checklist

- Manifest and definition IDs match and use stable reverse-DNS identity.
- Capabilities describe behavior, not brands or products.
- Permissions are minimal declarative requests and remain denied until host grants.
- Definitions pass `validatePluginContract` with API revision `1`.
- Unsupported revisions remain inactive and do not execute.
- Public imports come only from the specialized SDK and test runner.
- README documents purpose, API compatibility, permissions, installation, validation,
  attribution, and limitations.
- Breaking public changes follow `api-migration.md` with overlap, fixtures, and a guide.
