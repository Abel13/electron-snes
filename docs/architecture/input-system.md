# Input System

## Princípio

Hardware físico não conversa com o emulador.

## Fluxo

`Dispositivo -> Adapter -> Ação normalizada -> Mapeamento por console -> Emulador`

## Regras

- Gamepad/teclado como primeiro cidadão; mouse complementar.
- Foco previsível e posicionamento restaurável.
- Mapeamentos versionados e validados.
- Fallback de input sem travamento quando reconectar dispositivos.
