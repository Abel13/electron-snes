# Game metadata SDK

## Purpose

`@platform/game-sdk` defines declarative game metadata supplied by plugins. It is
separate from the user's local library: plugins describe catalog records while the
library owns local ROM references, favorites, recents, playtime, and selected artwork.

## Public contract

`defineGameMetadata` provides typed authoring and `validateGameMetadataPlugin` validates
untrusted definitions. Each plugin declares a default locale and unique records with:

- a plugin-local game ID and reverse-DNS console plugin ID;
- localized title and optional description, including the default locale;
- explicit source and license provenance;
- optional package-relative cover, icon, or screenshot references.

```ts
import { defineGameMetadata } from '@platform/game-sdk';

export default defineGameMetadata({
  manifest,
  metadata: {
    id: manifest.id,
    defaultLocale: 'en-US',
    records: [{
      id: 'orbit-demo',
      consoleId: 'org.example.portable-console',
      text: { 'en-US': { title: 'Orbit Demo' } },
      provenance: { source: 'Example author', license: 'CC0-1.0' },
      artwork: [{ kind: 'cover', path: 'assets/covers/orbit-demo.svg' }],
    }],
  },
});
```

Artwork paths must remain inside `assets/` in the plugin package. Remote downloads,
absolute paths, parent traversal, embedded bytes, executable providers, ROM content,
ROM hashes, saves, and commercial fixtures are not part of this contract.

## Ownership and compatibility

The host may adapt validated records into renderer-safe library views, but the SDK does
not write the library or select metadata automatically. A console plugin ID is an
extension-point reference, not a core dependency. Localization remains declarative and
may include BCP 47 locales beyond the host's official interface locales.

Validation returns safe discriminated diagnostics and does not access the network,
filesystem, Electron, or concrete plugins. Discovery and asset authorization remain
host responsibilities.
