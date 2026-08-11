# ADR 0032: Save-state capability

## Status

Accepted.

## Context

Save states capture emulator-owned runtime data and are optional, version-sensitive,
binary capabilities. The host must not infer support from a console or execute plugin
factories during structural validation.

## Decision

Keep save-state bytes opaque and tag them with a core ID and format version. Add optional
capture and restore operations to emulator sessions. Validate the relationship between
declared capabilities and session operations only after the host creates a session.

Retain plugin API revision 1 because the contract is additive. Keep persistence, slots,
autosave, filesystem access, and product UI outside the emulator SDK.

## Alternatives considered

- A platform-wide state format was rejected because emulator internals are core-owned.
- Executing `createSession` during plugin validation was rejected because validation must
  not run untrusted plugin code.
- Assuming every core supports save states was rejected in favor of capability detection.

## Consequences

Hosts can expose save states without console-specific conditions. Plugins remain
responsible for compatibility diagnostics, while the host owns safe persistence and UI.
