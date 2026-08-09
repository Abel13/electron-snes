# Foundation CI

The `Foundation validation` GitHub Actions workflow protects `develop` and pull
requests targeting `develop` or `main`. It runs on Ubuntu with Node.js 22 and
pnpm 10.33.0, matching the workspace's minimum supported Node version and pinned
package manager.

## Required validation

The workflow installs exactly the committed dependency graph with
`pnpm install --frozen-lockfile`, then runs:

```sh
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

`pnpm test` includes the plugin manifest and contract-fixture suites, so public
manifest compatibility is part of the foundation gate. The workflow has read-only
repository permissions and receives no publishing, release, filesystem, or plugin
execution credentials.

## Scope

This is the baseline validation gate, not a release pipeline. Platform packaging,
end-to-end Electron checks, artifact publication, and cross-platform matrices are
introduced only when their owning roadmap work is ready.
