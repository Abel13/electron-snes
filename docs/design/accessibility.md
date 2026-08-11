# Accessibility

## Obrigatório

- Navegação por teclado completa.
- Foco visível não dependente de cor.
- Contraste adequado em dark mode.
- Mensagens de erro com ação clara.
- `prefers-reduced-motion` respeitado.
- Sem clipping ou sobreposição em `en-US`, `pt-BR` e `zh-CN` nos tamanhos de janela
  suportados.
- Fontes com glifos CJK legíveis e nomes acessíveis traduzidos pelo mesmo locale visível.
- Troca de idioma preserva foco, ordem de leitura, navegação por teclado e controle, e
  anúncios de regiões vivas.

Sem hover para ações críticas; sem informação só por cor.

Testes do layout final devem cobrir expansão de texto, wrapping e truncamento definidos,
leitores de tela, estados de carregamento e erro, e renderização de chinês simplificado.
