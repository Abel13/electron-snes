# Navigation

## Princípios

- Estrutura simples e previsível (`Home`, `Library`, `Systems`, `Favorites`, `Search`, `Settings`).
- Direcionais respeitam layout visual.
- Foco inicial, retorno de foco e `back` consistentes.
- Estados de lista sempre: loading, vazio e erro.

## Implementação Phase 4

- O foco DOM é a fonte de verdade para mouse, teclado, controle e tecnologia assistiva.
- Setas e direcionais selecionam o elemento visível mais próximo na direção solicitada.
- Ação primária do controle ativa o elemento focado.
- Durante uma sessão, input normalizado é encaminhado ao console e não movimenta foco da UI.
- Trocas de coleção preservam uma ordem de foco previsível e não dependem de hover.
