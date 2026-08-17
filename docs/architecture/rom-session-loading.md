# ROM session loading

ROM loading consumes an opaque selection ID through a validated IPC operation. Electron main resolves the ID, reads the selected local file, and returns a copied `Uint8Array` with safe name and extension metadata.

The response has `loaded`, `invalid-rom`, and `unavailable` outcomes. Empty files are rejected, and
the maximum ROM size comes from the resolved console plugin's `maxRomBytes` declaration. For the
current official plugins, Game Boy uses 8 MiB and Game Boy Advance uses 32 MiB. Missing or unreadable
files produce a generic result without a path or operating-system error. This boundary does not
launch emulation; the worker owns that later step.
