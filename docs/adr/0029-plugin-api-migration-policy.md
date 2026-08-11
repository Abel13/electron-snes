# ADR 0029: Plugin API migration policy

## Status

Accepted.

## Context

PixelCore exposes versioned SDK contracts to third-party plugins. The existing integer
API revision and inclusive host support range determine compatibility, but they do not
define which changes retain a revision, how long older revisions remain supported, or
what evidence is required before removing one. Without a policy, internal refactoring
could unnecessarily break community plugins and breaking changes could reach authors
without a usable migration path.

## Decision

Treat additive, behavior-preserving changes as compatible within the current API
revision. Require a new positive integer revision for changes that invalidate a
previously valid plugin, change existing semantics, remove public contracts, tighten
required validation, or require plugin changes at a security boundary.

When a new revision is introduced, hosts retain the previous revision in their
inclusive support range for at least one stable host release by default. Earlier
removal requires a documented security or correctness reason. Deprecation remains
advisory while a revision is supported and cannot prevent activation by itself.

Every breaking revision requires migration documentation, before-and-after examples,
contract fixtures, compatibility tests, and diagnostics for unsupported plugins. The
same public runner validates official plugins, examples, scaffold output, and community
plugins. Unsupported plugins remain inactive and visible without executing code or
receiving permissions.

Plugin package semantic versions remain independent from manifest `apiVersion`.
Internal changes do not cause API revision churn, and hosts never silently rewrite or
negotiate a plugin's declared revision.

## Alternatives considered

- Using semantic package versions for host compatibility was rejected because package
  releases and host contract revisions evolve for different reasons.
- Requiring a new API revision for every additive export was rejected because it would
  create migration work without protecting compatibility.
- Supporting only the latest revision was rejected because it would make routine host
  upgrades disruptive for community plugins.
- Supporting every revision indefinitely was rejected because security, maintenance,
  and test costs may eventually require explicit retirement.
- Automatically upgrading manifests was rejected because it could change untrusted
  plugin semantics before validation and author consent.

## Consequences

- Public changes require compatibility classification and contract evidence.
- Hosts normally carry overlapping API revisions during migrations.
- Breaking revisions cost documentation, fixtures, tests, and migration examples before
  adoption.
- Security-driven removals remain possible but require explicit rationale and safe
  inactive diagnostics.
- Official and community plugins use one public compatibility process.
