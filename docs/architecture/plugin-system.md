# Plugin System

## Contrato mínimo de plugin

- `id`, `name`, `version`, `apiVersion`, `type`, `capabilities`, `permissions` (quando aplicável).

`version` identifica o release do plugin. `apiVersion` é uma revisão inteira única do
contrato público suportado pelo plugin; a compatibilidade é determinada pela faixa
inclusiva suportada pelo host. Consulte `plugin-api-versions.md`.

## Tipos

`console`, `emulator-core`, `controller`, `game-metadata`, `theme`, `integration`.

## Regras

- Preferir configuração declarativa (`json`/`yaml`) com validação no load.
- SDK com helpers (`defineConsole`, `defineController`, `defineEmulator`, `defineTheme`).
- Mudanças quebradas exigem estratégia de migração e nova versão de API quando necessário.
- Plugins recebem acesso mínimo e explícito aos recursos.
- Plugins com `apiVersion` fora da faixa suportada são descobertos como inativos e não
  executam código nem recebem permissões.
