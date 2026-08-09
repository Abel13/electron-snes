# Plugin System

## Contrato mínimo de plugin

- `id`, `name`, `version`, `apiVersion`, `type`, `capabilities`, `permissions` (quando aplicável).

## Tipos

`console`, `emulator-core`, `controller`, `game-metadata`, `theme`, `integration`.

## Regras

- Preferir configuração declarativa (`json`/`yaml`) com validação no load.
- SDK com helpers (`defineConsole`, `defineController`, `defineEmulator`, `defineTheme`).
- Mudanças quebradas exigem estratégia de migração e nova versão de API quando necessário.
- Plugins recebem acesso mínimo e explícito aos recursos.
