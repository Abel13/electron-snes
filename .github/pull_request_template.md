## Resumo

<!-- Descreva o problema e a solução em poucas linhas. -->

## Issue relacionada

<!-- Use uma palavra-chave de fechamento: Closes #123, Fixes #123 ou Resolves #123. -->

Closes #

## Tipo de mudança

- [ ] Correção
- [ ] Funcionalidade
- [ ] Plugin
- [ ] Refatoração
- [ ] Documentação
- [ ] Segurança
- [ ] Outro:

## Arquitetura e compatibilidade

- [ ] A mudança respeita `Plugins -> SDK -> Core Contracts`.
- [ ] Não introduz dependência do core em implementação específica.
- [ ] Avaliei extensão por plugin antes de alterar o core.
- [ ] Não há alteração de contrato público, ou documentei compatibilidade/migração abaixo.
- [ ] Incluí ADR, se a decisão tiver impacto arquitetural de longo prazo.

<!-- APIs alteradas, plugins afetados, versão de API e migração, se aplicável. -->

## Segurança e plataforma

- [ ] IPC, manifesto e entradas externas são validados quando aplicável.
- [ ] A mudança não amplia permissões nem acesso a filesystem sem justificativa.
- [ ] Avaliei Windows, macOS e Linux quando aplicável.

## UX e acessibilidade

- [ ] Fluxos alterados funcionam por gamepad, teclado e mouse, quando aplicável.
- [ ] Foco, estados de erro/vazio/carregamento e `prefers-reduced-motion` foram considerados.
- [ ] Usei tokens semânticos e nomes acessíveis, quando houver UI.

## Testes

<!-- Liste comandos executados e resultado. Explique o que não foi testado. -->

- [ ] Testes unitários/contrato relevantes
- [ ] Testes de integração relevantes
- [ ] Typecheck e lint relevantes

## Checklist final

- [ ] Escopo focado; sem mudanças não relacionadas.
- [ ] Commits seguem Conventional Commits em inglês.
- [ ] Commits relacionados incluem o número da issue (`#123`).
- [ ] A PR contém uma referência de fechamento para cada issue resolvida.
- [ ] Documentação pública atualizada, quando aplicável.
- [ ] Erros, limites e riscos conhecidos estão documentados.
