# ADR-0016: Emulator SDK Contract

## Context

PixelCore needs a public emulator-core boundary before integrating the first Game Boy
and Game Boy Color core. The platform must not depend on a concrete emulator or allow
filesystem and device details to leak into emulation.

## Decision

Introduce `@platform/emulator-sdk` with declarative core metadata and session ports for
ROM buffers, console actions, video frames, audio frames, lifecycle operations, and
capabilities. Plugins use `defineEmulator`; host code validates untrusted declarations
before use.

## Alternatives considered

- Put the first core directly in the Electron app: rejected because it prevents
  third-party core replacement and violates plugin direction.
- Pass filesystem paths to cores: rejected because it grants ambient file authority.
- Couple input to physical controllers: rejected because physical adaptation belongs
  to the input domain.

## Consequences

- The SameBoy adapter can implement a stable session interface without defining the
  platform runtime.
- Video, audio, and worker delivery remain independently implementable by later issues.
- Capability declarations prevent UI and session code from assuming optional features.

## Status

aceito
