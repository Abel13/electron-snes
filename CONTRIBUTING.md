# Como contribuir

Obrigado por contribuir com a plataforma. Antes de abrir uma pull request (PR), verifique as diretrizes em `AGENTS.md` e a documentação em `docs/`.

## Princípios

- O core não pode depender de implementações específicas de consoles, emuladores, controllers, jogos, temas ou integrações.
- Prefira plugins, SDKs, capacidades e configuração declarativa a condicionais específicas no core.
- Mantenha as responsabilidades de Core, Input, Emulator, Library e UI separadas.
- Trate plugins e toda comunicação IPC como não confiáveis até validação.

## Fluxo de contribuição

1. Crie a branch correta a partir de `develop` conforme o Git Flow.
2. Mantenha a PR focada em um problema ou entrega.
3. Inclua testes compatíveis com o risco da mudança.
4. Atualize a documentação pública quando alterar SDKs, contratos, configuração ou comportamento observável.
5. Preencha integralmente o template de PR.

## Branches (Git Flow)

As branches permanentes são:

- `main`: versões estáveis publicadas; recebe apenas merges de `release/*` e `hotfix/*`.
- `develop`: integração da próxima versão; recebe features, fixes e releases concluídas.

Crie branches temporárias a partir da origem indicada:

- `feature/<issue>-<description>` a partir de `develop`, para uma nova funcionalidade. Exemplo: `feature/123-controller-profiles`.
- `fix/<issue>-<description>` a partir de `develop`, para corrigir comportamento ainda não publicado. Exemplo: `fix/123-input-reconnect`.
- `release/<version>` a partir de `develop`, para estabilizar uma versão. Exemplo: `release/1.2.0`.
- `hotfix/<issue>-<description>` a partir de `main`, para corrigir uma versão publicada. Exemplo: `hotfix/123-security-validation`.
- `docs/<issue>-<description>` a partir de `develop`, para documentação. Exemplo: `docs/123-plugin-guide`.

Abra PRs para:

- `feature/*`, `fix/*` e `docs/*` em `develop`.
- `release/*` em `main`; propague os ajustes necessários de volta para `develop`.
- `hotfix/*` em `main`; propague o hotfix de volta para `develop`.

O número da issue é obrigatório no nome de toda branch relacionada a uma issue. Use descrição curta, em inglês, separada por hífens.

## Títulos de issues

O título da issue deve ser compacto, descritivo e utilizável diretamente no nome da branch. Use inglês, verbo no imperativo e até cinco palavras quando possível.

Formato recomendado:

```text
<verb> <domain or outcome>
```

Exemplos:

```text
Add controller profiles
Restore input after reconnect
Validate plugin permissions
Document SDK compatibility
```

Evite títulos genéricos como `Fix bug`, `Improve UI` ou `Update code`. A branch derivada preserva o sentido do título em kebab-case: `feature/123-add-controller-profiles`.

## Convenções

- Use TypeScript estrito; evite `any`.
- Não misture lógica de domínio, filesystem, ciclo de vida do emulador ou descoberta de plugins em componentes React.
- Use tokens semânticos e preserve navegação por gamepad, teclado e mouse em mudanças de UI.
- Novos plugins devem seguir o guia em `docs/plugins/creating-a-plugin.md`.

## Commits e issues

- Use Conventional Commits em inglês: `type(scope): short imperative description`.
- Tipos usuais: `feat`, `fix`, `docs`, `refactor`, `test`, `build`, `ci`, `chore` e `perf`.
- Quando o commit estiver relacionado a uma issue, inclua seu número: `fix(input): restore controller after reconnect #123`.
- Cada commit deve ter um único propósito e um único tipo Conventional Commit.
- Não misture `feat`, `fix`, `test` e `docs` no mesmo commit. Faça commits separados para implementação, testes e documentação.
- Não inclua refatorações não relacionadas em commits de funcionalidade ou correção.
- A descrição da PR deve conter uma palavra-chave de fechamento e a issue correspondente, por exemplo: `Closes #123`.

Exemplos válidos:

```text
feat(plugin-sdk): add manifest permission validation #123
docs(architecture): document plugin compatibility policy #124
fix(input): restore controller after reconnect #125
```

## Bloqueios locais de commit

Quando o projeto tiver a base Node configurada, o Husky deve bloquear commits que não atendam aos critérios verificáveis abaixo:

- Cabeçalho fora de Conventional Commits.
- Tipo não permitido.
- Descrição vazia, em português ou sem verbo no imperativo.
- Número de issue ausente quando a branch seguir o padrão com issue.

A separação entre código, testes, documentação e outros propósitos será exigida na revisão da PR. Essa regra depende da intenção da alteração e não deve ser automatizada apenas pela extensão ou localização dos arquivos.

## Testes esperados

Escolha os testes de acordo com a alteração:

- Lógica de domínio: testes unitários.
- SDKs e contratos públicos: testes de contrato e compatibilidade.
- Plugins: validação de manifesto e testes do plugin.
- Controllers: testes de mapeamento e reconexão quando aplicável.
- Integrações entre domínios: testes de integração.
- Fluxos críticos de interface: testes de UI, incluindo navegação por teclado/controller.

## Quando criar um ADR

Inclua um ADR em `docs/adr/` quando a PR introduzir ou mudar uma decisão de longo prazo, como:

- contrato público, versão de API ou estratégia de compatibilidade;
- fronteira entre pacotes ou direção de dependência;
- modelo de permissões, segurança Electron ou execução de plugins;
- persistência, formato de dados ou abstração de storage;
- arquitetura de emulação, input ou extensibilidade.

Use o próximo número sequencial e inclua: contexto, decisão, alternativas, consequências e status (`proposto`, `aceito`, `substituído` ou `rejeitado`).

## Antes de solicitar revisão

- Confirme que o escopo da PR está claro e sem alterações não relacionadas.
- Execute `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm test` e `pnpm build` para mudanças de workspace ou tooling.
- A workflow `Foundation validation` executa o mesmo gate em PRs para `develop` e
  `main`; consulte `docs/architecture/foundation-ci.md`.
- Documente compatibilidade, migrações e limitações conhecidas.
- Descreva como a mudança foi testada e o que não foi testado.
