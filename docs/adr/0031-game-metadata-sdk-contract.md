# ADR 0031: Game metadata SDK contract

## Status

Accepted.

## Context

PixelCore needs community metadata without bundling commercial catalogs or coupling the
local library to a specific provider. The game SDK package existed as an empty boundary,
so metadata examples had no stable public declaration, provenance, localization, or
asset validation rules.

## Decision

Define game metadata plugins as JSON-safe records with a plugin-local ID, console plugin
reference, localized text, explicit provenance, and optional package-relative artwork.
Expose typed `defineGameMetadata` and pure `validateGameMetadataPlugin` boundaries from
`@platform/game-sdk`.

Keep local ROM identity, user library state, metadata selection, persistence, downloads,
and asset authorization outside this SDK. Reject remote and unsafe asset paths, embedded
content, ROM hashes, saves, and executable providers from the initial contract.

Retain plugin API revision `1` because this additive contract does not invalidate an
existing game metadata definition.

## Alternatives considered

- Storing plugin records directly as local library entries was rejected because user
  state and provider data have different lifecycles.
- Requiring ROM hashes was rejected because hashes can identify copyrighted content and
  are unnecessary for the first declarative example contract.
- Allowing remote artwork URLs was rejected because network permission, caching, and
  provenance require separate mediated capabilities.
- Executable metadata providers were rejected because static examples can be delivered
  more safely through validated data.

## Consequences

- Metadata plugins can be authored, localized, licensed, and validated independently.
- The host must mediate package assets before exposing them to the renderer.
- A future identification capability can associate local games without changing library
  storage ownership.
- Network-backed providers require a separate capability and permission design.
- Official examples and the contract runner can now exercise this SDK boundary.
