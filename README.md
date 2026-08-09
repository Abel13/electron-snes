# PixelCore

<img src="apps/desktop/assets/brand/pixelcore-icon.png" alt="PixelCore" width="160">

> Play. Preserve. Connect.

Os masters oficiais de marca estão em `apps/desktop/assets/brand/`. Consulte o
[guia de marca](docs/design/brand.md) antes de criar telas, splash screens ou assets
de empacotamento.

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

## Primeiro recorte jogável

A primeira família oficial é Game Boy + Game Boy Color. O produto aceita ROMs locais
`.gb` e `.gbc` fornecidas pelo usuário, com suporte de compatibilidade para jogos de
Game Boy executados pelo console Game Boy Color. SNES permanece uma expansão futura,
sem acoplamento ao core da plataforma.

Consulte [a especificação da família Game Boy](docs/product/game-boy-family.md) para
o escopo de controles, política de ROMs e estratégia de testes.

## Desenvolvimento local

Requisitos: Node.js 22 ou superior e pnpm 10.33.0.

```sh
corepack enable
pnpm install
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test
pnpm build
```

O workspace usa pnpm e Turborepo. A estrutura de packages e suas dependências estão documentadas em `docs/architecture/monorepo.md`.
