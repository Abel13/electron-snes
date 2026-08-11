# Plugin Permissions

## Purpose

Plugin permissions are declarative requests for host-mediated resources. They do not
give a plugin filesystem, Electron, Node.js, network, IPC, or module-loading access.
Every request is evaluated with default-deny semantics before a future runtime may
perform an operation.

## Resource definitions

`@platform/core` publishes these initial resource definitions:

| Resource | Actions | Consent |
| --- | --- | --- |
| `library:rom-content` | `read` | user |
| `storage:plugin-data` | `read`, `write` | none |
| `storage:game-saves` | `read`, `write` | user |
| `network:outbound` | `execute` | user |
| `input:devices` | `list`, `read` | user |
| `integration:external` | `execute` | user |

Resources remain named contracts rather than raw implementation handles. A future
host can add resource definitions without changing the manifest syntax.

## Assessment

`assessPermissionRequest(request, grants, resources?)` is pure and returns one of:

- `granted` when every requested action is supported by the resource and covered by an
  explicit grant for that same resource.
- `denied` with `missing-grant` when a known resource lacks one or more grants.
- `unavailable` with `unknown-resource` or `unsupported-action` when the host cannot
  offer the requested authority.

Resource matching is exact. There are no wildcard resources, wildcard actions, or
implicit grants. Multiple grants for the same resource may combine their explicitly
listed actions.

## Boundaries

The manifest schema validates the request shape. This policy evaluates typed requests
and grants. Future Electron, IPC, filesystem, network, consent UI, persistence, and
plugin execution code must enforce the resulting decision at the operation boundary;
none are implemented here.
