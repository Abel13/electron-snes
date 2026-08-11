# Plugin contract fixtures

`packages/plugin-sdk/fixtures` contains versioned, declarative examples used to
protect the public plugin-manifest contract. They are test data, not installed
plugins, executable examples, or a plugin discovery location.

## Fixture groups

| Directory | Purpose |
| --- | --- |
| `valid` | One compatible v1 manifest for each supported plugin category. |
| `inactive` | Structurally valid manifests that are intentionally ineligible for activation. |
| `invalid` | Malformed manifests that must produce safe validation diagnostics. |

The valid set covers `console`, `emulator-core`, `controller`, `game-metadata`,
`theme`, and `integration`. Values are generic and do not refer to commercial
games, console brands, filesystem locations, Electron APIs, or implementation
modules.

## Maintenance rules

- Add or change a fixture only when a public plugin contract changes or a known
  compatibility case requires protection.
- Keep fixtures JSON-only and declarative. They must never load code, request
  ambient filesystem access, or contain ROM, save, or user data.
- Every fixture change needs a focused contract test using the public schema or
  validation API.
- A fixture with an unsupported API revision remains structurally valid and
  verifies inactive discovery behavior; it does not model activation.

These fixtures are test inputs for the SDK. Future official plugins and plugin
examples remain separate packages and must validate against the same contracts.
