# Plugin System

## Contrato mínimo de plugin

- `id`, `name`, `version`, `apiVersion`, `type`, `capabilities`, `permissions` (quando aplicável).

`version` identifica o release do plugin. `apiVersion` é uma revisão inteira única do
contrato público suportado pelo plugin; a compatibilidade é determinada pela faixa
inclusiva suportada pelo host. Consulte `plugin-api-versions.md`.

O formato estrito de `manifest.json`, seus campos e limites estão em
`plugin-manifest.md`. O schema define a estrutura; validação em runtime e diagnósticos
pertencem à fronteira de validação de manifestos.

A validação classifica manifestos como `valid`, `inactive` ou `invalid`. Apenas os
dois primeiros chegam ao registry: `valid` torna-se `eligible`; `inactive` permanece
listável e resolvível por ID para diagnóstico, sem execução de código ou permissões.
Manifestos `invalid` não são registráveis. Consulte `plugin-manifest-validation.md` e
`plugin-registry.md`.

Fixtures versionadas de contratos em `@platform/plugin-sdk` cobrem manifestos
válidos, inativos e inválidos sem criar plugins executáveis. Consulte
`plugin-contract-fixtures.md`.

## Tipos

`console`, `emulator-core`, `controller`, `game-metadata`, `theme`, `integration`.

Console plugins use the public `@platform/console-sdk` declaration and validation
boundary; see `console-sdk.md`.

## Regras

- Preferir configuração declarativa (`json`/`yaml`) com validação no load.
- SDK com helpers (`defineConsole`, `defineController`, `defineEmulator`, `defineTheme`).
- Mudanças quebradas exigem estratégia de migração e nova versão de API quando necessário.
- Plugins recebem acesso mínimo e explícito aos recursos.
- Uma declaração no manifesto não é autorização: o host aplica default deny, exige
  grants explícitos e medeia cada recurso permitido. Consulte `plugin-permissions.md`.
- Plugins com `apiVersion` fora da faixa suportada são descobertos como inativos e não
  executam código nem recebem permissões.
