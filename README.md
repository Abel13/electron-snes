# Electron SNES

## Entendimento do projeto

Plataforma desktop de emulação retro modular e extensível, com foco em:

- Arquitetura orientada a plugins e contratos de SDK, sem acoplamento do core a console/emulador/controller/jogo/específicos.
- Execução cross-platform (Windows, macOS, Linux) com Electron + React + TypeScript + Vite.
- Domínio separado em Core, Input, Emulator, Library e UI.
- Segurança por padrão em Electron (IPC validado, contextIsolation, permissões e limites de filesystem para plugins).
- UX/controller-first com acessibilidade, foco visível, estados vazio/erro/carregamento e design system com tokens.
- Compatibilidade e extensibilidade guiadas por versionamento de API e ADRs.

Estrutura de governança:

- `.github/agents/` (arquitetura, design e revisão)
- `docs/architecture/` (princípios, plugin system, input)
- `docs/design/` (princípios de UX, tokens, navegação, acessibilidade)
- `docs/adr/` (decisões arquiteturais)

Objetivo operacional:
Manter uma base escalável, testável, segura e de fácil contribuição para novos consoles, emuladores, controllers, metadados, temas e integrações.
