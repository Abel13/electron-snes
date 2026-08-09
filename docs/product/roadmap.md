# Product Roadmap

## Direção

O roadmap prioriza uma plataforma jogável de ponta a ponta antes de ampliar catálogo e recursos avançados. A evolução deve preservar extensibilidade, segurança e uma experiência retro sem fricção.

## Fases

### 1. Fundação

Estabelecer contratos seguros e estáveis.

- Monorepo e fronteiras entre pacotes.
- Electron seguro, IPC validado e preload mínimo.
- Contratos SDK versionados.
- Registry e validação de plugins.
- Abstrações de storage e logging.

### 2. Sessão jogável

Entregar o ciclo essencial de jogo.

- Biblioteca local e seleção de ROM.
- Um console oficial e um core de emulação oficial.
- Carregamento de ROM, vídeo, áudio e ciclo de vida da sessão.
- Pausar, retomar e encerrar sessão com segurança.

### 3. Input universal

Permitir que dispositivos atuais funcionem naturalmente.

- Teclado e Gamepad API.
- Ações normalizadas independentes de hardware.
- Mapeamento por console.
- Perfis, remapeamento e reconexão de dispositivos.
- Testes de mapeamento e fallback de input.

### 4. Experiência de produto

Transformar a base jogável em uma experiência agradável.

- Home, Library, Search, Favorites e Recently Played.
- Arte de jogos, metadados e estados de carregamento, vazio, erro e indisponibilidade.
- Navegação controller-first, teclado e mouse.
- Foco visível, acessibilidade e motion reduzido.

### 5. Ecossistema de plugins

Permitir expansão sem modificar o core.

- SDKs públicos e documentação completa.
- Estrutura ou CLI para iniciar plugins.
- Plugins oficiais de exemplo.
- Testes de contrato e validação automatizada de plugins.
- Política de compatibilidade e migração de API.

### 6. Recursos avançados

Ampliar a qualidade da sessão de jogo quando suportado pelo core.

- Save states e autosave.
- Rewind e fast-forward por capability.
- Configuração por jogo.
- Playtime, favoritos e metadados enriquecidos.

### 7. Qualidade e lançamento

Preparar distribuição confiável e manutenção contínua.

- CI com typecheck, lint, testes e validação de plugins.
- Builds para Windows, macOS e Linux.
- Releases usando Git Flow.
- Atualizações e telemetria opcional, segura e transparente.

## Fluxo da primeira experiência jogável

```text
Plugin registry
  -> Console plugin
  -> Emulator-core plugin
  -> ROM loading
  -> Video and audio
  -> Normalized input
  -> Controller mapping
  -> Library UI
  -> Save states
```

## Recorte da primeira versão

- Um console oficial: SNES.
- Um core oficial.
- Teclado e gamepad genérico.
- Biblioteca local, sem conta, sincronização ou loja.
- Abrir ROM, jogar, pausar e encerrar.
- Save state, quando a capability do core estiver disponível.
- Um plugin de controller de exemplo, em vez de suporte específico a marcas.

## Marco de extensibilidade

O marco que valida a arquitetura é permitir que um desenvolvedor externo adicione um perfil de controle ou um console por plugin, sem alterar o core. Esse critério deve ser comprovado com um plugin de exemplo e testes de contrato antes de expandir o ecossistema.
