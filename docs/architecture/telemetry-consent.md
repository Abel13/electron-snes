# Telemetry consent

PixelCore does not collect telemetry by default. Consent is persisted as one explicit state: `undecided`, `declined`, or `granted`. Missing and legacy preferences always migrate to `undecided`; silence is never consent.

No telemetry provider or network sink is included in the initial release. A future sink requires a separate security review and must remain disabled unless consent is `granted`. Withdrawing consent must stop future transmission immediately without affecting gameplay.

## Data boundary

Telemetry must never include ROM bytes, ROM names, hashes, filesystem paths, save files, save states, artwork, controller identifiers, free-form logs, IP addresses stored by PixelCore, or unnecessary personal data. Any future event catalog must be closed, versioned, documented before collection, and limited to product reliability measurements.

Consent must explain the event catalog, purpose, retention, destination, and withdrawal path in all official locales. Declining cannot reduce application functionality or repeatedly prompt the user.
