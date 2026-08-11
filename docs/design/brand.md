# PixelCore Brand

## Masters oficiais

Os assets de marca ficam junto ao aplicativo desktop, em
`apps/desktop/assets/brand/`:

- `pixelcore-icon.png`: símbolo quadrado com transparência, para ícone da aplicação,
  atalhos, favicon e superfícies compactas.
- `pixelcore-logo.png`: símbolo, wordmark e tagline com transparência, para splash,
  onboarding, tela Sobre e materiais de apresentação em fundo escuro.

Os dois arquivos são masters raster. As conversões para `.ico`, `.icns` e formatos
específicos de pacote devem derivar destes arquivos durante a futura configuração de
empacotamento Electron; não devem substituir os masters.

## Uso

- Usar o ícone em tamanhos pequenos ou quando o nome PixelCore já estiver presente na
  interface.
- Usar a logo completa quando houver espaço suficiente para o wordmark e a tagline.
- Apresentar a logo completa sobre superfícies escuras para manter a legibilidade do
  wordmark branco.
- Reservar espaço livre ao redor do símbolo e da logo; não sobrepor controles, texto
  ou arte de jogo.

## Restrições

- Não alterar o gradiente violeta-azul-ciano, a geometria, a proporção ou a tagline.
- Não aplicar filtros, sombras adicionais, contornos, animações decorativas ou novas
  cores aos masters.
- Não usar a cor da marca como único indicador de foco, estado ou erro.
- Não recriar o símbolo com texto, CSS ou SVG improvisado quando o master oficial for
  adequado.

## Integração futura

O renderer e o empacotamento Electron ainda não existem neste recorte do projeto. Ao
serem implementados, devem referenciar estes arquivos para a splash screen, a tela
Sobre, o ícone de janela e os artefatos de instalação em Windows, macOS e Linux.
