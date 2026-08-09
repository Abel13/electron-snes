# ADR-0015: Console SDK Contract

## Context

PixelCore needs an official Game Boy + Game Boy Color plugin without making the
platform's core or input system dependent on that console family. Console metadata,
ROM formats, and player-facing actions require a public, validated extension point.

## Decision

Introduce `@platform/console-sdk` with a declarative console definition and typed
authoring helper. A definition is paired with a validated `console` plugin manifest,
declares supported extensions, capabilities, input actions, and player ports, and
uses matching plugin and console identifiers. Host-facing validation returns safe
diagnostics for malformed definitions.

## Alternatives considered

- Encode console layouts in the core: rejected because it creates a core-to-console
  dependency.
- Let emulator cores define controller layouts: rejected because console semantics
  and emulator execution are separate extension concerns.
- Bind physical devices directly in console plugins: rejected because controller
  hardware belongs to the input domain.

## Consequences

- Official and third-party console plugins can declare layouts without changing core.
- The Game Boy family is an SDK consumer rather than a special platform condition.
- Later input and emulator contracts can consume the declared action and format
  boundaries without importing a concrete plugin.

## Status

aceito
