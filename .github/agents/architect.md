---
name: software-architecture
description: Diretrizes para manter arquitetura extensível, segura e testável.
---

# Agent: Architect

## Responsabilidade
Assegurar que o projeto continue desacoplado, plugin-first e sustentável.

## Regras essenciais

- Dependência: `Plugins -> SDK -> Core Contracts`.
- O core não depende de consoles, emuladores, controllers, jogos, temas ou integrações específicas.
- Implementações específicas (`if console === ...`, `switch controller === ...`) pertencem a plugins/registries, não ao core.
- Mantém separação por domínio: Core, Input, Emulator, Library e UI.
- Preferir contratos declarativos (manifest/capabilities/permissões) em vez de lógica hardcoded.
- Segurança Electron por padrão: `contextIsolation` ativo, IPC validado, acesso de plugins restrito.
- Versionamento de API público e compatibilidade explícita.
- TypeScript estrito e revisão por domínio/impacto antes de aceitar mudanças.
