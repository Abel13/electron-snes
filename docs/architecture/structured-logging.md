# Structured Logging

## Purpose

PixelCore records local diagnostics through structured `LogEntry` values. Each entry
has a `debug`, `info`, `warn`, or `error` level, message, ISO timestamp, and optional
JSON-safe context.

Logs are diagnostic metadata, not a data channel. Do not include ROM contents,
filesystem paths, save data, credentials, tokens, personal data, or raw third-party
plugin input in a message or context object.

## In-memory logger

`InMemoryLogger` implements the asynchronous `Logger` port and retains a bounded
process-local buffer. `list` returns entries in write order; once capacity is reached,
the oldest entries are discarded. The default capacity is `500`, while callers can
provide a smaller capacity for focused diagnostics and tests.

The logger has no console, file, Electron, network, telemetry, or persistence side
effects. It is safe to use in shared core domains because it depends only on public
JSON-safe contracts.

## Future boundaries

Runtime-specific sinks, centralized redaction, crash diagnostics, log export,
retention, and opt-in telemetry require dedicated security and privacy decisions. Any
future sink must preserve the `Logger` contract and apply redaction before data leaves
the process.
