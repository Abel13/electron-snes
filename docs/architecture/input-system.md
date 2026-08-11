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

## Contratos da Phase 3

`@platform/input` owns normalized platform actions, keyboard and standard Gamepad API
adapters, device discovery, deterministic player assignment, console mapping validation,
and persisted input profiles. Hardware adapters emit only normalized actions and never
import console or emulator APIs.

The official console plugin declares a version 1 mapping from normalized actions to its
own input action IDs. The desktop composition root validates and applies that mapping,
then sends only the active console actions and player port through allowlisted IPC. The
SameBoy worker receives a complete pressed-action snapshot each update, including empty
snapshots that release buttons.

Input profiles are stored in the `user-preferences` JSON domain. They remain separate
from ROMs, game saves, save states, emulator state, and plugin configuration.

## Reconnection

Assignments persist a device fingerprint rather than a transient Gamepad API index. A
disconnect resolves to no active actions immediately. A matching device fingerprint is
reassigned deterministically when it returns; the emulator session continues running
through both events.
