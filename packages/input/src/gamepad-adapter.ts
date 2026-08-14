import type { NormalizedInputAction } from './actions.js';
import type { GamepadSnapshot } from './devices.js';

export interface GamepadPhysicalInput {
  readonly index: number;
  readonly kind: 'button';
}

export interface GamepadBinding extends GamepadPhysicalInput {
  readonly normalizedAction: NormalizedInputAction;
}

export const RESERVED_GAMEPAD_BUTTON_INDEX = 9;

export const DEFAULT_GAMEPAD_BINDINGS: readonly GamepadBinding[] = [
  { index: 12, kind: 'button', normalizedAction: 'move-up' },
  { index: 13, kind: 'button', normalizedAction: 'move-down' },
  { index: 14, kind: 'button', normalizedAction: 'move-left' },
  { index: 15, kind: 'button', normalizedAction: 'move-right' },
  { index: 0, kind: 'button', normalizedAction: 'primary' },
  { index: 1, kind: 'button', normalizedAction: 'secondary' },
  { index: 6, kind: 'button', normalizedAction: 'left-shoulder' },
  { index: 7, kind: 'button', normalizedAction: 'right-shoulder' },
  { index: 8, kind: 'button', normalizedAction: 'start' },
  { index: 4, kind: 'button', normalizedAction: 'select' },
] as const;

export const PLATFORM_GAMEPAD_BINDINGS: readonly GamepadBinding[] = [
  ...DEFAULT_GAMEPAD_BINDINGS.filter(
    (binding) => binding.normalizedAction !== 'start' && binding.normalizedAction !== 'select',
  ),
  { index: 9, kind: 'button', normalizedAction: 'start' },
  { index: 8, kind: 'button', normalizedAction: 'select' },
] as const;

export const readPressedGamepadButtons = (gamepad: GamepadSnapshot): readonly number[] =>
  gamepad.buttons.flatMap((button, index) =>
    index <= 63 && (button.pressed || button.value >= 0.5) ? [index] : [],
  );

export class GamepadInputAdapter {
  public constructor(private readonly axisThreshold = 0.5) {}

  public readActions(
    gamepad: GamepadSnapshot,
    bindings: readonly GamepadBinding[] = DEFAULT_GAMEPAD_BINDINGS,
  ): readonly NormalizedInputAction[] {
    if (!gamepad.connected) return [];
    const actions = new Set<NormalizedInputAction>();
    for (const binding of bindings) {
      const button = gamepad.buttons[binding.index];
      if (button?.pressed === true || (button?.value ?? 0) >= this.axisThreshold)
        actions.add(binding.normalizedAction);
    }

    const horizontal = gamepad.axes[0] ?? 0;
    const vertical = gamepad.axes[1] ?? 0;
    if (horizontal <= -this.axisThreshold) actions.add('move-left');
    if (horizontal >= this.axisThreshold) actions.add('move-right');
    if (vertical <= -this.axisThreshold) actions.add('move-up');
    if (vertical >= this.axisThreshold) actions.add('move-down');
    return [...actions].sort();
  }
}
