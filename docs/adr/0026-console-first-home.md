# ADR 0026: Console-first home

- Status: aceito

## Contexto

A biblioteca como destino inicial comunica um gerenciador de arquivos, enquanto o PixelCore precisa
priorizar uma experiência de videogame extensível. A home também deve apresentar a visão futura do
produto sem transformar sistemas não implementados em plugins falsos.

## Decisão

A aplicação sempre abre, após o startup, em um carrossel fullscreen com um console central. A
disponibilidade vem exclusivamente de definições válidas de plugins, exposta ao renderer como IDs
seguros. Um catálogo declarativo de produto acrescenta artwork, geração, formatos e sistemas futuros.
O desktop é o composition root que combina as fontes em `ConsoleCatalogItem`.

O Game Boy Family representa `.gb` e `.gbc` e abre a biblioteca atual. Sistemas futuros permanecem
selecionáveis, recebem feedback de indisponibilidade e não executam código. Durante uma sessão, o
runtime de input continua sendo o único consumidor das ações do console.

## Alternativas consideradas

- Manter a biblioteca como home: rejeitado por enfraquecer a identidade de videogame.
- Criar plugins placeholder: rejeitado porque confundiria visão de produto com capacidade instalada.
- Codificar disponibilidade no core: rejeitado por violar `Plugins -> SDK -> Core Contracts`.
- Mostrar consoles vizinhos: rejeitado para preservar foco, legibilidade e impacto do sistema ativo.

## Consequências

O catálogo visual pode evoluir sem alterar o core, enquanto novos plugins oficiais tornam entradas
existentes jogáveis pelo mesmo contrato. A composição desktop precisa manter IDs e assets de produto
alinhados. Navegação, reduced motion, localização e feedback indisponível passam a fazer parte do
contrato de experiência da home.
