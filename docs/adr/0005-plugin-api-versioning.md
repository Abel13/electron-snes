# ADR-0005: Plugin API Versioning

## Context

PixelCore plugins need a stable way to declare the public API revision they expect.
Plugin package versions cannot express host-contract compatibility, and loading an
unknown revision risks runtime failures or unsafe access.

## Decision

Use one positive integer `apiVersion` per plugin. The host owns an inclusive support
range and starts at `1..1`. Future hosts retain prior compatible revisions by default
through an expanded range, such as `1..2`.

Compatibility assessment is pure and returns a discriminated result. Unsupported
versions are discovered as inactive with a structured diagnostic and never become
eligible for activation. Manifest validation remains responsible for malformed or
missing values.

## Alternatives considered

- Exact version equality only: rejected because it would force immediate retirement of
  compatible older plugins when a later API revision is added.
- Plugin-declared version ranges: rejected because each plugin is authored against one
  concrete public contract revision.
- Attempting to load unsupported versions: rejected because compatibility must be
  established before plugin code executes or permissions are considered.

## Consequences

- The host must maintain adapters and documentation while it advertises older API
  revisions in its support range.
- Breaking API changes require an explicit revision, migration guidance, and
  compatibility tests.
- Registry work can present incompatible plugins diagnostically without activating
  them.

## Status

aceito
