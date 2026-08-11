# ADR 0033: Deterministic plugin scaffold CLI

## Status

Accepted.

## Context

Community authors need a low-friction path from an ID and plugin type to a package that
matches repository structure and contract tests. Copying arbitrary plugins risks stale
contracts, while interactive generators are difficult to document and automate.

## Decision

Provide a deterministic, non-interactive `@platform/plugin-cli` that generates complete
packages for plugin types with stable declarative definition contracts. Templates use
only public SDKs and `@platform/plugin-test`, validate the manifest before writing, and
never overwrite existing paths.

Do not scaffold plugin types that cannot pass the complete public contract runner.
Filesystem behavior remains in the CLI package and does not enter SDK or core packages.

## Alternatives considered

- Copy-only documentation was rejected because examples can drift from required files.
- Interactive prompts were rejected because explicit flags are easier to automate.
- Generating every manifest type was rejected because incomplete SDKs would create
  examples that cannot pass the public contract gate.
- Installing dependencies automatically was rejected because package-manager and
  workspace mutation should remain under author control.

## Consequences

- Generated plugins begin with consistent manifests, tests, and package boundaries.
- Adding a scaffold type requires a complete specialized SDK and runner registration.
- Authors still own domain data, licensing, permissions, and runtime behavior.
- The CLI can later expose additional frontends without changing scaffold semantics.
