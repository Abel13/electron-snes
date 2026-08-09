# ADR-0012: Electron Security Baseline

## Context

PixelCore needs an Electron shell before UI, IPC, ROM selection, or plugin runtime
work can begin. A default renderer with Node access or unrestricted navigation would
make later extension points unsafe by design.

## Decision

Enable application sandboxing and create desktop windows with context isolation,
disabled Node integration, sandboxing, web security, insecure-content blocking, and a
minimal preload. Deny popups and navigation. The shell initially loads only
`about:blank` and exposes no callable renderer API.

## Alternatives considered

- Enable Node integration for convenience: rejected because renderer compromise would
  become local process compromise.
- Expose Electron modules through preload: rejected because future renderer APIs must
  be narrow, typed, and validated.
- Permit arbitrary navigation or popups: rejected because remote content cannot share
  the application security boundary.

## Consequences

- Future renderer delivery needs a trusted local origin and CSP before it replaces the
  blank shell.
- IPC issue #13 must add explicit, validated channels instead of broad preload access.
- Tests can assert the security options without starting Electron in a graphical host.

## Status

aceito
