# Enriched game metadata

Console plugins may extract generic identifiers from ROM bytes without retaining content. The
official Game Boy family plugin emits `game-boy-header-title` from the cartridge header; truncated
or malformed headers produce no identifier.

Validated game-metadata plugins may associate records with identifiers and provide localized text,
release date, developers, publishers, genres, player counts, safe local artwork references, and
provenance. Resolution uses the requested locale and then the plugin default locale. Invalid plugins
are ignored and plugin code is never executed during metadata resolution.

The library persists identifiers only, never ROM bytes or metadata hashes. Enriched fields
complement renderer records; favorites, playtime, local source references, and user-selected artwork
remain authoritative and are never overwritten by a provider.
