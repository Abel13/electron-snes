# ADR-0011: Structured Logging

## Context

PixelCore needs useful diagnostics before Electron runtime, persistence, telemetry, or
plugin execution are introduced. Unstructured console output cannot provide a stable
contract, while durable or external logging would introduce security and privacy
decisions too early.

## Decision

Keep the asynchronous `Logger` port and provide an `InMemoryLogger` implementation in
`@platform/core`. It retains structured JSON-safe entries in write order with a bounded
capacity and discards the oldest entries when full. The implementation has no console,
file, network, telemetry, or Electron side effects.

## Alternatives considered

- Console logging as the primary implementation: rejected because it is not a stable
  diagnostic boundary and can expose data unexpectedly.
- File logging now: rejected because paths, retention, redaction, permissions, and
  platform-specific lifecycle are not established.
- Unbounded in-memory logging: rejected because a diagnostic buffer must not grow
  indefinitely in a desktop process.
- Telemetry or remote logging now: rejected because consent and privacy policy are
  outside the foundation scope.

## Consequences

- Core services can record inspectable diagnostics without platform dependencies.
- Consumers must provide already-sanitized JSON-safe context.
- Future sinks can implement the same port after dedicated security and privacy work.

## Status

aceito
