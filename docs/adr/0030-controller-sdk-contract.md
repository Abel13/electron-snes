# ADR 0030: Controller SDK contract

## Status

Accepted.

## Context

PixelCore needs community controller profiles without coupling the input runtime to a
brand, browser device, console, or emulator. The controller SDK package existed as an
empty boundary, so examples could not rely on a stable public declaration or validation
contract.

## Decision

Define controller plugins as declarative manifests plus device match criteria and a
one-to-one mapping from physical button or directional-axis inputs to normalized action
identifiers. Expose typed `defineController` and pure `validateControllerPlugin`
boundaries from `@platform/controller-sdk`.

Keep device polling, discovery, player assignment, permissions, and reconnection in the
input runtime. Keep console mappings in console plugins. Matching uses data only and
does not execute expressions or grant access.

Retain plugin API revision `1` because the package previously exposed no public
controller contract and the addition does not invalidate a valid plugin definition.

## Alternatives considered

- Placing controller profiles in `@platform/input` was rejected because plugins would
  depend on a runtime implementation package.
- Mapping directly to console buttons was rejected because hardware and console layouts
  are independent extension points.
- Accepting executable match functions was rejected because declarative matching is
  safer, portable, and easier to validate.
- Modeling only standard gamepads was rejected because directional axes and nonstandard
  devices need a public representation.

## Consequences

- Controller plugins can be authored and validated without Electron or core internals.
- The input runtime must adapt validated definitions before polling devices.
- Physical inputs and normalized actions are unique within one definition.
- Axis triggers and richer physical controls can be added compatibly when optional.
- Official examples and the contract runner can now exercise this SDK boundary.
