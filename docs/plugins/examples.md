# Official-style plugin examples

Examples are executable workspace packages that use only public SDKs and the public
`@platform/plugin-test` runner. They teach extension structure without becoming host
dependencies or installed product plugins.

| Example | Purpose |
| --- | --- |
| `plugins/consoles/reference-handheld` | Minimal fictional console with declarative actions, player port, mapping, and ROM extension. |

Every example contains a strict manifest, typed definition, contract test, and README.
Examples must remain free of commercial ROMs, proprietary artwork, Electron APIs,
filesystem access, and imports from core implementations.
