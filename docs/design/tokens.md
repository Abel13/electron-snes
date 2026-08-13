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

## Tokens implementados

A experiência Phase 4 materializa os tokens como propriedades CSS `--pc-*` no desktop:

- superfícies `bg`, `surface` e `surface-strong`;
- texto `text` e `muted`;
- acentos `cyan`, `blue` e `violet`;
- bordas `line` e `line-bright`;
- raios `sm`, `md` e `lg`;
- sombra elevada `shadow`.

Motion usa apenas transform e opacity para entradas, foco e transição de sessão. O
fallback de movimento reduzido desativa partículas e animações decorativas.

## Tokens de cena

Assets e cenas devem usar tokens, não cores ou intensidades livres dentro dos componentes:

- `console-accent`: cor de destaque declarada pelo catálogo do console;
- `scene-atmosphere`: cor difusa de fundo e halos ambientais;
- `scene-frame`: borda, glow e sombra da superfície de vídeo;
- `scene-particles`: opacidade e densidade de partículas decorativas;
- `scene-motion`: duração e intensidade de transições não essenciais.

O perfil visual do console fornece valores para esses tokens. A UI pode aplicá-los, mas
não infere a aparência pelo identificador do console. Em reduced motion, `scene-motion`
é reduzido a troca curta de opacidade e `scene-particles` é desativado.
