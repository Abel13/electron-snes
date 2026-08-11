# ADR 0035: Fast-forward capability

## Status

Aceito.

## Contexto

Fast-forward changes emulator scheduling and audio behavior, but the platform must expose it
without depending on a particular emulator, console, or acceleration factor.

## Decisao

Model fast-forward as an optional boolean capability paired with an asynchronous hold/release
operation on `EmulatorSession`. Capability validation requires the operation only when support is
declared. Acceleration factor, frame pacing, and audio suppression remain private to each emulator
plugin.

## Alternativas

- Change the desktop worker timer directly: rejected because it couples the host to emulator
  implementation details.
- Require fast-forward on every emulator session: rejected because cores have different scheduling
  and audio capabilities.
- Expose a mutable speed multiplier in the public API: rejected because the initial product only
  requires capability-driven hold/release behavior.

## Consequencias

UI controls can be capability-driven and emulator-neutral. Plugins remain backward compatible when
they do not support fast-forward. Declaring support creates a testable obligation to implement the
method while leaving performance policy inside the plugin.
