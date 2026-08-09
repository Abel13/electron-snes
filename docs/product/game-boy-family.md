# Game Boy + Game Boy Color

## Purpose

Game Boy and Game Boy Color are the first official console family in PixelCore. This
is a product focus, not a core dependency: the platform continues to support future
console families through versioned plugin contracts.

## Initial playable scope

- Accept local user-supplied ROM files with `.gb` and `.gbc` extensions.
- Run Game Boy ROMs through the Game Boy Color-compatible console and emulator core.
- Support normalized directional input, `A`, `B`, `Start`, and `Select`.
- Support keyboard and generic gamepads through the input mapping system.
- Let users open a ROM, play, pause, resume, and end a session safely.

The first official core must declare compatibility with both formats. Support for a
file extension alone is not sufficient: the core must validate the ROM before starting
a session.

## ROM and library policy

PixelCore does not distribute commercial ROMs, game assets, or game metadata that it
does not have the right to distribute. Users select and add ROMs from local storage
through explicit Electron file-access boundaries.

The library stores only the references and metadata necessary to identify a user-added
game. It must not copy ROM contents into generic application configuration.

## Save data

ROM files remain owned and supplied by the user. Save files and save states are local
user data, stored separately from ROM locations, application configuration, library
metadata, and cache. They are not bundled with a ROM, synchronized by default, or
shared by the platform.

## Test guidance

Pokémon Yellow may be used by its lawful owner as a private manual compatibility check
for the `.gb` flow. It must not be committed, hashed, uploaded, referenced as a
download, or used as an automated repository fixture.

Automated tests use homebrew, public-domain, or otherwise redistributable fixtures.
They must cover format validation, session startup and termination, normalized input,
and the separation of ROM paths from local save data.

## Future consoles

SNES is intentionally deferred. Its console plugin, emulator-core plugin, file-format
support, mappings, and compatibility fixtures are future work and must not introduce
console-specific behavior into the core or shared contracts.
