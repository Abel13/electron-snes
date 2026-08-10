# Ícones da interface

O PixelCore usa fontes visuais diferentes conforme a responsabilidade do asset:

- `lucide-react` para ícones funcionais da interface;
- Kenney Input Prompts para referências de teclado, mouse e controles;
- assets originais do PixelCore para marca, consoles, cartuchos e ilustrações.

## Uso semântico

Componentes devem usar exclusivamente o componente `Icon` exportado por
`@platform/ui`. Telas não importam componentes do Lucide diretamente. O registry
tipado associa cada `IconName` semântico ao ícone visual, mantendo consumidores
independentes da biblioteca escolhida.

Ícones funcionais usam estilo outline, `currentColor`, terminações arredondadas e
espessura padrão `1.7`. Cor, brilho, placa e estados ativos pertencem ao CSS do
PixelCore. Preenchimento é reservado a estados semânticos, como favorito ativo.

Os ícones são decorativos e usam `aria-hidden`; botões e controles continuam
responsáveis por seus próprios nomes acessíveis. Novos ícones devem ser incluídos
no tipo, registry e testes antes do uso.
