# ADR-0014: Plugin Contract Fixtures

## Context

PixelCore needs stable representative inputs for its public plugin-manifest
contract before official plugin packages and discovery exist. Ad hoc objects in
individual tests would not provide a visible, reusable compatibility suite.

## Decision

Store JSON-only contract fixtures in `packages/plugin-sdk/fixtures`, grouped as
valid, inactive, and invalid. Cover every supported plugin category with a
compatible v1 manifest, preserve one future API revision as inactive, and retain
one malformed manifest that exercises safe diagnostics. Test the fixtures through
the public manifest schema and validation API.

## Alternatives considered

- Add executable reference plugins now: rejected because plugin packages,
  discovery, and activation are outside the foundation scope.
- Keep fixtures inline in tests: rejected because shared contract inputs should
  be inspectable and reusable by later SDK and CI work.
- Store product ROMs or console-specific metadata in fixtures: rejected because
  the plugin contract must remain generic and the repository must not distribute
  commercial game content.

## Consequences

- Public manifest changes have concrete compatibility inputs to update and test.
- Fixtures remain outside package distribution and do not establish plugin
  implementation conventions.
- Future contract-test tooling can consume the same fixtures without granting
  filesystem or code-execution authority to plugins.

## Status

aceito
