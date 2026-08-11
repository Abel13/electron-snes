# ADR-0007: Plugin Manifest Validation

## Context

Plugin manifests are untrusted input. The platform needs a consistent boundary that
converts unknown values into typed manifests, distinguishes structural errors from API
incompatibility, and provides actionable diagnostics without exposing schema-library
details or raw input.

## Decision

Expose a synchronous `validatePluginManifest` function in `@platform/plugin-sdk`.
It uses the canonical schema, collects all structural issues into safe diagnostics, and
then evaluates API compatibility.

Return three outcomes: `valid` for eligible manifests, `inactive` for structurally
valid but API-incompatible manifests, and `invalid` for structural failures. Inactive
plugins remain diagnostic-only and cannot execute code or receive permissions.

## Alternatives considered

- Treat unsupported API revisions as invalid: rejected because discovery needs to show
  actionable compatibility information separately from malformed input.
- Return only the first schema error: rejected because plugin authors benefit from a
  complete correction set.
- Expose Zod errors directly: rejected because it couples consumers to an internal
  library and may expose unsafe implementation details.

## Consequences

- Consumers branch explicitly on validation state before discovery or activation.
- Future registry work can surface inactive plugins without re-parsing manifests.
- Diagnostic codes and paths become public compatibility surface and change
  conservatively.

## Status

aceito
