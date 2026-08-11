# ADR 0032: Public plugin contract runner

## Status

Accepted.

## Context

Official examples, scaffold output, CI, and community plugins need one compatibility
gate. Test-framework helpers inside runtime SDKs would mix concerns, while duplicated
validation would drift.

## Decision

Create `@platform/plugin-test` as a separate public tooling package. It validates
manifest structure and API compatibility first, delegates definitions to specialized
SDK validators, and normalizes results. It is pure, synchronous, framework neutral, and
does not load plugin modules.

Types without a specialized definition validator return an explicit unavailable
diagnostic. Manifest validity alone is not complete contract validity.

## Alternatives considered

- Vitest-specific helpers were rejected because authors may use other test runners.
- Adding dispatch to `@platform/plugin-sdk` was rejected because it would invert the
  dependency from the common SDK to specialized SDKs.
- A filesystem CLI was deferred because loading untrusted modules is a separate boundary.
- Treating every valid manifest as a valid plugin was rejected because definitions can
  still violate their specialized contract.

## Consequences

- Tooling depends on specialized SDKs without creating SDK cycles.
- Official and community plugins receive identical validation outcomes.
- New specialized SDK contracts must be registered before their definitions pass.
- Activation, discovery, and authorization remain host responsibilities.
