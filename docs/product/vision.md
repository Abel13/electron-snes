# Product Vision

## Retro sem fricção

Criar uma plataforma desktop bonita e atual para jogar clássicos com a simplicidade esperada de um produto contemporâneo. A interface celebra os jogos antigos, enquanto controles, configuração e navegação funcionam sem atrito.

## Experiência desejada

O usuário abre a biblioteca, encontra um jogo, aperta jogar e usa o dispositivo que já tem: teclado, controle Xbox, PlayStation, 8BitDo ou um controle customizado. Compatibilidade e configuração não devem interromper a sessão de jogo.

O primeiro recorte jogável contempla Game Boy e Game Boy Color. O suporte inicial a
Game Boy preserva a compatibilidade com ROMs `.gb`; Game Boy Color inclui também
ROMs `.gbc`. SNES é uma expansão futura da mesma plataforma extensível.

## Princípios de produto

1. Qualquer controle deve parecer nativo.
2. Jogar deve exigir menos esforço que configurar.
3. O visual celebra o retrô, mas a interação é contemporânea.
4. A interface deve funcionar integralmente com controle, teclado e mouse.
5. Recursos avançados devem estar disponíveis sem competir com a ação de jogar.
6. Novos consoles, controles e integrações devem poder ser adicionados sem alterar o core.

## Direção de experiência

- Biblioteca visual, organizada e acolhedora, com jogos e arte em destaque.
- Navegação direcional previsível, foco visível e retorno de foco consistente.
- Feedback rápido para inputs, carregamento, conexão e erros.
- Mapeamento de controles simples, com perfis por dispositivo, console e jogo quando necessário.
- Reconexão de dispositivos sem travar a sessão ou exigir reinício.
- Estados de carregamento, vazio, erro e indisponibilidade claros e acionáveis.
- Motion discreto e respeitoso a `prefers-reduced-motion`.
- ROMs fornecidas localmente pelo usuário, com saves e save states mantidos no
  computador do usuário e separados da biblioteca e da configuração da aplicação.

## Direção técnica

Dispositivos físicos são traduzidos em ações normalizadas e só então mapeados para cada console. Emuladores não conhecem marcas ou modelos de controles.

```text
Hardware -> Adapter do controller -> Ação normalizada -> Mapeamento do console -> Emulador
```

O suporte a novos dispositivos deve preferir plugins, contratos SDK e mapeamentos declarativos. O core permanece independente de consoles, emuladores, controllers, jogos, temas e integrações específicas.

## Como avaliar decisões

Antes de aceitar uma mudança, pergunte:

- Ela reduz ou aumenta o esforço entre escolher um jogo e jogar?
- Ela continua utilizável com gamepad, teclado e mouse?
- Ela preserva uma experiência clara em desktop e TV?
- Ela pode ser estendida por terceiros sem mudar o core?
- Ela mantém segurança, acessibilidade e desempenho durante a emulação?
