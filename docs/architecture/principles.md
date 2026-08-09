# Architecture Principles

## Núcleo da arquitetura

- Dependência orientada: `Plugins -> SDK -> Core Contracts`.
- Core desacoplado de consoles/emuladores/controllers/jogos/integrações específicos.
- Domínios separados: Core, Input, Emulator, Library, UI.
- TypeScript estrito e contratos explícitos.
- Plugins declarativos com manifesto/validacao/capabilities.
- Segurança Electron por padrão e validação de IPC/inputs.
- Renderer Electron isolado, sem Node integration, com sandbox, preload mínimo e
  bloqueio de navegação/popup externo.
- Comunicação IPC explicitamente contratada e validada nas fronteiras de preload e
  processo principal: `ipc-boundaries.md`.
- Diagnósticos estruturados, JSON-safe e sem conteúdo de ROM, paths, secrets ou dados
  pessoais desnecessários.
- Performance: evitar acoplamento de alto-volume de estado à renderização React.
- Layout, ownership e direção de dependência: `monorepo.md`.
- Contratos públicos do core: `core-contracts.md`.
