import type { NormalizedInputAction } from './actions.js';
import type { GamepadSnapshot } from './devices.js';

const buttonActions = new Map<number, NormalizedInputAction>([
  [0, 'primary'],
  [1, 'secondary'],
  [8, 'select'],
  [9, 'start'],
  [12, 'move-up'],
  [13, 'move-down'],
  [14, 'move-left'],
  [15, 'move-right'],
]);

export class GamepadInputAdapter {
  public constructor(private readonly axisThreshold = 0.5) {}

  public readActions(gamepad: GamepadSnapshot): readonly NormalizedInputAction[] {
    if (!gamepad.connected) return [];
    const actions = new Set<NormalizedInputAction>();
    for (const [buttonIndex, action] of buttonActions) {
      const button = gamepad.buttons[buttonIndex];
      if (button?.pressed === true || (button?.value ?? 0) >= this.axisThreshold)
        actions.add(action);
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
