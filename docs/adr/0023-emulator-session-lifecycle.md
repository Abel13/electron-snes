# ADR 0023: Coordinate emulator sessions in the runtime domain

## Status

Accepted.

## Context

Launching a ROM requires ordered creation, output subscription, loading, start, pause, resume, failure cleanup, and stop behavior. Implementing that sequence in Electron or React would mix runtime lifecycle with platform transport or presentation.

## Decision

`@platform/emulator` provides a generic `EmulatorSessionController` that receives an `EmulatorPluginDefinition` and optional output callbacks through injection. It preserves typed `EmulatorOperationResult` failures, cleans up failed launches, and keeps only one active session per controller.

## Alternatives considered

- Put session control in React: rejected because rendering must not own emulator lifetime.
- Import the SameBoy plugin in the desktop app: rejected because the composition root must not depend directly on a concrete plugin.
- Let each plugin invent its own lifecycle policy: rejected because host behavior would become inconsistent.

## Consequences

The runtime domain owns reusable lifecycle behavior while plugin discovery and activation remain separate concerns. A future host composition adapter must supply approved plugin definitions and forward output safely. The controller does not add save states, input mapping, ROM selection, persistence, or plugin loading.
