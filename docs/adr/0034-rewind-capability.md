# ADR 0034: Rewind capability

## Status

Aceito.

## Contexto

Rewind requires core-specific state capture and restoration, but the platform must expose the
feature without depending on a particular emulator or console.

## Decisao

Model rewind as an optional boolean capability paired with an asynchronous hold/release operation
on `EmulatorSession`. Capability validation requires the operation only when support is declared.
History duration and implementation remain private to each emulator plugin.

## Alternativas

- Poll a core-specific rewind API from the desktop application: rejected because it reverses the
  plugin dependency direction.
- Require rewind on every emulator session: rejected because many cores cannot provide it.
- Expose individual historical states to the renderer: rejected because it leaks binary runtime
  details and increases IPC pressure.

## Consequencias

UI controls can be capability-driven and emulator-neutral. Plugins remain backward compatible when
they do not support rewind. Declaring support creates a testable obligation to implement the method.
