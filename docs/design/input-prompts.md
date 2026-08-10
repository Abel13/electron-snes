# Prompts adaptativos de entrada

Os prompts visuais do PixelCore representam ações semânticas da interface, não layouts de console ou APIs físicas. A UI solicita ações como confirmar, voltar, navegar, Start e Select; o desktop fornece o esquema correspondente ao último dispositivo usado.

## Esquemas iniciais

- `desktop`: teclado e mouse.
- `xbox`: controles Xbox e fallback para qualquer gamepad desconhecido.
- `playstation`: IDs Sony, PlayStation, DualShock, DualSense e Wireless Controller.

A classificação afeta apenas a apresentação. Ela não altera perfis, atribuição de jogadores, mapeamentos do console ou entrada encaminhada ao emulador.

## Troca de dispositivo

- Movimento real ou clique do mouse e qualquer tecla selecionam `desktop`.
- Uma nova borda de botão ou eixo acima do limite seleciona a família do gamepad.
- Drift analógico e entradas mantidas não causam trocas repetidas.
- Qualquer gamepad conectado pode atualizar os prompts, mesmo sem estar atribuído ao jogador.
- Desconexão preserva o último esquema até uma nova interação válida.

Os prompts devem manter dimensões estáveis durante a troca, possuir rótulo acessível e respeitar `prefers-reduced-motion`. Novas famílias devem ser adicionadas por classificação declarativa sem introduzir conhecimento de consoles no core ou na UI de produto.
