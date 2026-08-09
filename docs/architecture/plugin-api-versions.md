# Plugin API Versions

## Purpose

The plugin API version defines the public contract revision between PixelCore and a
plugin. It is independent of a plugin package version: `version` identifies the plugin
release, while `apiVersion` identifies the contract the plugin was authored against.

## Version model

Each plugin declares one positive integer `apiVersion`. The host declares an inclusive
`PluginApiSupportRange` with `minInclusive` and `maxInclusive` revisions.

PixelCore starts at API version `1` and supports the range `1..1`. A future host may
support `1..2` to retain compatible API version 1 plugins while adding version 2.

Additive changes that preserve the public contract retain the current API revision.
Breaking changes require a new revision, migration guidance, compatibility tests, and
an ADR when they have architectural impact.

## Compatibility boundary

`assessPluginApiCompatibility` compares an already-parsed plugin API revision with a
host support range. The result is discriminated:

- A compatible plugin is `eligible` for activation.
- An unsupported plugin is `inactive` and receives the
  `unsupported-plugin-api-version` diagnostic.

Discovery may expose inactive plugins for diagnostics, but they must not execute code
or receive permissions. Manifest parsing and malformed-value validation belong to the
manifest validation boundary.

## Responsibilities

- `@platform/plugin-sdk` owns API revision types, support ranges, and pure
  compatibility assessment.
- Manifest schema and validation own presence, integer, and positivity checks for
  `apiVersion`.
- Registry implementation owns discovery state and activation.
- Permission implementation owns authorization after compatibility is confirmed.

The API version contract does not expose Electron, filesystem APIs, plugin internals,
or concrete plugin categories.
