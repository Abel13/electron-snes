# Como contribuir

Obrigado por contribuir com a plataforma. Antes de abrir uma pull request (PR), verifique as diretrizes em `AGENTS.md` e a documentação em `docs/`.

## Princípios

- O core não pode depender de implementações específicas de consoles, emuladores, controllers, jogos, temas ou integrações.
- Prefira plugins, SDKs, capacidades e configuração declarativa a condicionais específicas no core.
- Mantenha as responsabilidades de Core, Input, Emulator, Library e UI separadas.
- Trate plugins e toda comunicação IPC como não confiáveis até validação.

## Fluxo de contribuição

1. Crie uma branch curta e descritiva a partir da branch principal.
2. Mantenha a PR focada em um problema ou entrega.
3. Inclua testes compatíveis com o risco da mudança.
4. Atualize a documentação pública quando alterar SDKs, contratos, configuração ou comportamento observável.
5. Preencha integralmente o template de PR.

## Convenções

- Use TypeScript estrito; evite `any`.
- Não misture lógica de domínio, filesystem, ciclo de vida do emulador ou descoberta de plugins em componentes React.
- Use tokens semânticos e preserve navegação por gamepad, teclado e mouse em mudanças de UI.
- Novos plugins devem seguir o guia em `docs/plugins/creating-a-plugin.md`.

## Commits e issues

- Use Conventional Commits em inglês: `type(scope): short imperative description`.
- Tipos usuais: `feat`, `fix`, `docs`, `refactor`, `test`, `build`, `ci`, `chore` e `perf`.
- Quando o commit estiver relacionado a uma issue, inclua seu número: `fix(input): restore controller after reconnect #123`.
- Mantenha cada commit focado em uma alteração coerente.
- A descrição da PR deve conter uma palavra-chave de fechamento e a issue correspondente, por exemplo: `Closes #123`.

Exemplos válidos:

```text
feat(plugin-sdk): add manifest permission validation #123
docs(architecture): document plugin compatibility policy #124
fix(input): restore controller after reconnect #125
```

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
- Execute os comandos de validação definidos pelo projeto para as áreas alteradas.
- Documente compatibilidade, migrações e limitações conhecidas.
- Descreva como a mudança foi testada e o que não foi testado.
