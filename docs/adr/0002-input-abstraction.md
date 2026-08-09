# ADR-0002: Abstração de Input por Ações Normalizadas

## Contexto
Inputs de diferentes controllers e teclado não devem poluir as camadas de emulador.

## Decisão
Adotar fluxo: `hardware -> adapter -> ação normalizada -> mapeamento por console -> emulador`, com mapeamentos principalmente declarativos.

## Alternativas consideradas
- Lógica de input dentro do emulador (rejeitada por baixa extensibilidade).

## Impacto
Simplifica suporte a novos dispositivos e mantém emuladores independentes de hardware.
