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
- Uma família oficial de consoles: Game Boy + Game Boy Color, com um core de
  emulação compatível com `.gb` e `.gbc`.
- Carregamento de ROM, vídeo, áudio e ciclo de vida da sessão.
- Pausar, retomar e encerrar sessão com segurança.

### 3. Input universal

Permitir que dispositivos atuais funcionem naturalmente.

Esta fase permanece dedicada a input e não introduz dependências, contratos ou mudanças
de interface para internacionalização.

- Teclado e Gamepad API.
- Ações normalizadas independentes de hardware.
- Mapeamento inicial para direcional, `A`, `B`, `Start` e `Select`, sem acoplar
  adaptadores de hardware ao layout da família Game Boy.
- Perfis, remapeamento e reconexão de dispositivos.
- Testes de mapeamento e fallback de input.

### 4. Experiência de produto

Transformar a base jogável em uma experiência agradável.

- Home, Library, Search, Favorites e Recently Played.
- Arte de jogos, metadados e estados de carregamento, vazio, erro e indisponibilidade.
- Navegação controller-first, teclado e mouse.
- Foco visível, acessibilidade e motion reduzido.
- Layout final internacionalizado em `en-US`, `pt-BR` e `zh-CN`, com detecção do
  sistema, preferência persistida e fallback para inglês.
- Fundação de localização, suporte declarativo para plugins, catálogos oficiais e testes
  de layouts traduzidos entregues em unidades independentes.

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

- Uma família oficial: Game Boy + Game Boy Color.
- Um core oficial compatível com ROMs `.gb` e `.gbc`.
- Teclado e gamepad genérico.
- Biblioteca local, sem conta, sincronização ou loja.
- Abrir ROM, jogar, pausar e encerrar.
- Save state, quando a capability do core estiver disponível.
- Um plugin de controller de exemplo, em vez de suporte específico a marcas.
- ROMs são adicionadas localmente pelos usuários; a plataforma não distribui jogos
  comerciais.

## Expansões futuras

SNES permanece planejado como um console oficial posterior. Sua chegada deve ocorrer
por plugins de console e de core compatíveis com os contratos públicos, sem alterações
específicas no core da plataforma.

## Marco de extensibilidade

O marco que valida a arquitetura é permitir que um desenvolvedor externo adicione um perfil de controle ou um console por plugin, sem alterar o core. Esse critério deve ser comprovado com um plugin de exemplo e testes de contrato antes de expandir o ecossistema.
