# ADR 0037: Telemetry consent

## Status

Accepted

## Context

Product reliability data can help releases, but retro-game libraries contain highly sensitive local content and paths. Consent must exist before any provider is considered.

## Decision

Persist a versioned, explicit consent state with `undecided`, `declined`, and `granted`. Defaults and migrations use `undecided`; no state implies permission. The initial release ships without a telemetry sink. Future collection requires a reviewed closed event catalog and must exclude ROMs, saves, local paths, hardware identifiers, and free-form payloads.

## Alternatives

- Opt-out collection was rejected because it transmits before informed consent.
- Treating continued use as consent was rejected because it is neither explicit nor accessible.
- Reusing structured logs was rejected because logs may contain contextual data not approved for transmission.

## Consequences

Preferences advance to version 2 and v1 migrates safely without granting consent. A future telemetry implementation remains a separate issue and cannot bypass this contract.
