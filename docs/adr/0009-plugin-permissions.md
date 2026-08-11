# ADR-0009: Plugin Permissions

## Context

Plugin manifests already declare named resource requests and actions, but declarations
alone must never grant access to local user data, devices, network services, or host
integrations. PixelCore needs a public least-privilege policy before Electron runtime
or plugin execution is introduced.

## Decision

Define host-mediated permission resources in `@platform/core`, with their supported
actions and consent requirement. Represent authorization separately as explicit
`PermissionGrant` values and assess each request using the pure
`assessPermissionRequest` helper.

The policy is default-deny. Resource names match exactly; unknown resources and
unsupported actions are unavailable, while missing grant coverage is denied. Initial
resources describe ROM content, plugin data, game saves, outbound network, input
devices, and external integrations without exposing direct platform handles.

## Alternatives considered

- Treat manifest requests as grants: rejected because third-party declarations are
  untrusted and would bypass user and host control.
- Expose filesystem paths or Electron APIs as resources: rejected because permissions
  must mediate capability rather than leak platform authority.
- Use wildcard resources or actions: rejected because they weaken reviewability and
  violate least privilege.
- Add runtime enforcement now: rejected because Electron, IPC, filesystem, consent,
  and plugin execution boundaries are separate implementation concerns.

## Consequences

- Future runtime adapters must enforce a permission assessment before each operation.
- Plugin authors can request stable named capabilities without learning host internals.
- New resource definitions require security, compatibility, documentation, and test
  review, but do not require changing manifest syntax.

## Status

aceito
