# Design Tokens

## Essencial

Use tokens semânticos para manter consistência:

- `color` (`surface`, `text`, `focus`, `status`)
- `typography` (`title`, `body`, `caption`)
- `spacing`, `radius`, `shadow`, `motion`

Não usar valores livres repetidos; sempre referenciar tokens.

## Direção de marca

Os tokens semânticos devem permitir a identidade PixelCore sem acoplar componentes a
arquivos de imagem:

- `surface` privilegia fundos azul-marinho quase pretos.
- `accent` usa a progressão violeta, azul e ciano da marca para ações e estados de
  destaque, sempre com alternativa não baseada apenas em cor.
- `text` mantém contraste alto sobre superfícies escuras.

Os valores concretos e os tokens implementados pertencem à futura implementação do
design system. Consulte [Brand](brand.md) para a aplicação dos masters visuais.
