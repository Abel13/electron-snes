# Plugin Registry

## Purpose

The plugin registry keeps already-validated plugin manifests available to the host.
It is an in-memory boundary: it does not scan directories, parse files, load modules,
execute plugin code, grant permissions, or persist state.

## Registration states

`PluginRegistry` accepts only structural validation outcomes that include a manifest:

- `valid` manifests become `eligible` records.
- `inactive` manifests remain `inactive` records with their compatibility diagnostic.
- `invalid` results have no manifest and cannot be registered.

Inactive records are visible through `list` and `resolve` for diagnostics, but they
never imply activation eligibility.

## Contracts

`@platform/core` provides `Registry<T>` and `InMemoryRegistry<T>`. The generic
implementation stores entries by identifier, lists them in deterministic identifier
order, and returns `Result` failures for duplicate (`conflict`) or absent
(`not-found`) entries.

`@platform/plugin-sdk` adapts validated manifests through `PluginRegistry`. Its
`register` method accepts `ValidPluginManifest | InactivePluginManifest`; `list`,
`resolve`, and `remove` use the same asynchronous `Result` convention as core.

## Usage

```ts
const validation = validatePluginManifest(candidate);

if (validation.status !== 'invalid') {
  await registry.register(validation);
}
```

Discovery owns the `unknown` candidate and decides how to retain diagnostics for an
`invalid` result. A future runtime activation boundary must check for `eligible`
records before loading any plugin code or considering permissions.

## Rules

- A plugin identifier is registered at most once; a duplicate never replaces it.
- Registry state is process-local and non-persistent.
- Consumers must handle `Result` failures explicitly.
- The registry exposes only public contracts and never imports Electron, filesystem,
  concrete plugin, or module-loading APIs.
