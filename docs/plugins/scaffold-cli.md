# Plugin scaffold CLI

`@platform/plugin-cli` creates deterministic plugin packages from public contracts.
Build the workspace, then run:

```sh
pnpm --filter @platform/plugin-cli start -- create \
  --type console \
  --id org.example.my-console \
  --name "My Console" \
  --output plugins/consoles/my-console
```

Supported templates are `console`, `controller`, and `game-metadata`. Emulator cores
require an intentional runtime implementation, while theme and integration SDKs do not
yet expose complete definition validators; the CLI does not generate misleading stubs.

Each scaffold contains a strict manifest, typed definition, contract test, README,
package manifest, and TypeScript build configuration. The command validates identity
before writing and refuses to overwrite any existing path.

Generated values are references, not product defaults. Authors must replace fictional
extensions, actions, matching criteria, metadata, provenance, and permissions, then run
the public contract test. The CLI never installs dependencies, reads ROMs, discovers
plugins, or activates code.
