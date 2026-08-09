# Plugin Manifest Validation

## Purpose

`validatePluginManifest` is the pure boundary between untrusted manifest data and a
typed plugin manifest. It accepts `unknown` input, applies `PluginManifestSchema`, and
evaluates the declared API revision against the host support range.

It does not read a manifest file, resolve a plugin location, discover plugins, load
code, grant permissions, mutate a registry, or emit logs.

## Results

The validation result is discriminated by `status`:

| Status | Meaning | Activation |
| --- | --- | --- |
| `valid` | The manifest is structurally valid and its API revision is supported. | Eligible. |
| `inactive` | The manifest is structurally valid, but its API revision is unsupported. | Never eligible. |
| `invalid` | The manifest has one or more structural schema failures. | Blocked. |

`inactive` retains the parsed manifest and compatibility result so future discovery can
show it diagnostically. It never authorizes or executes the plugin.

## Diagnostics

Structural failures produce every available `manifest-schema-invalid` diagnostic.
Each diagnostic contains a stable code, a readonly string/number path, and a safe
message. Zod issue objects, error codes, stack traces, and raw untrusted input are not
exposed.

Unsupported revisions produce one `unsupported-plugin-api-version` diagnostic at
`apiVersion`. The diagnostic does not repeat the untrusted declared value.

## Consumer example

```ts
const result = validatePluginManifest(candidate);

if (result.status === 'invalid') {
  return result.diagnostics;
}

if (result.status === 'inactive') {
  return [result.diagnostic];
}

return result.manifest;
```

## Responsibilities

- The schema owns field structure and format.
- This boundary owns safe parsing, result classification, and diagnostic conversion.
- The future registry owns file discovery and display of inactive plugins.
- The permission system owns authorization after a plugin is compatible and selected.
