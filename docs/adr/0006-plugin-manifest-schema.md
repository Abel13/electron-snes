# ADR-0006: Plugin Manifest Schema

## Context

PixelCore needs a public, machine-readable manifest contract before plugin discovery,
compatibility evaluation, permission enforcement, or code loading can occur. The
contract must be strict enough to reject accidental and unsafe fields while remaining
extensible through future API revisions.

## Decision

Use Zod 4 in `@platform/plugin-sdk` as the canonical v1 manifest schema and infer its
public TypeScript types from the schema. Require reverse-DNS IDs, SemVer releases,
positive integer API revisions, a closed plugin type set, unique kebab-case
capabilities, and strict declarative permission requests.

Reject unknown root and permission fields. The schema defines structure only; runtime
validation behavior, compatibility evaluation, discovery state, and diagnostics remain
separate responsibilities.

## Alternatives considered

- TypeScript interfaces only: rejected because third-party manifests need an
  executable runtime contract.
- JSON Schema as the v1 source of truth: rejected in favor of a single Zod schema and
  directly inferred SDK types.
- Permissive unknown root fields: rejected because typos and unreviewed extension
  points weaken security and predictability.

## Consequences

- Plugin authors receive one strict declarative contract for manifests.
- Schema evolution requires API compatibility review, documentation, and tests.
- The validation boundary can consume the schema without redefining fields or rules.
- New common manifest fields require a deliberate API revision or compatible schema
  evolution.

## Status

aceito
