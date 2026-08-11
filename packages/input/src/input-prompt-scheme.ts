import type { GamepadSnapshot } from './devices.js';

export type InputPromptScheme = 'desktop' | 'playstation' | 'xbox';

const PLAYSTATION_ID = /playstation|dualshock|dualsense|wireless controller|sony|054c/i;
const XBOX_ID = /xbox|xinput|microsoft|045e/i;

export const classifyGamepadPromptScheme = (id: string): InputPromptScheme => {
  if (XBOX_ID.test(id)) return 'xbox';
  if (PLAYSTATION_ID.test(id)) return 'playstation';
  return 'xbox';
};

interface GamepadActivityState {
  readonly axes: readonly number[];
  readonly buttons: readonly boolean[];
}

export class GamepadPromptActivityTracker {
  readonly #previous = new Map<number, GamepadActivityState>();

  public detect(gamepads: readonly (GamepadSnapshot | null)[]): GamepadSnapshot | undefined {
    let active: GamepadSnapshot | undefined;
    const connected = new Set<number>();
    for (const gamepad of gamepads) {
      if (gamepad === null || !gamepad.connected) continue;
      connected.add(gamepad.index);
      const previous = this.#previous.get(gamepad.index);
      const buttonEdge = gamepad.buttons.some(
        (button, index) =>
          (button.pressed || button.value >= 0.65) && previous?.buttons[index] !== true,
      );
      const axisEdge = gamepad.axes.some(
        (axis, index) => Math.abs(axis) >= 0.65 && Math.abs(previous?.axes[index] ?? 0) < 0.45,
      );
      if (buttonEdge || axisEdge) active = gamepad;
      this.#previous.set(gamepad.index, {
        axes: [...gamepad.axes],
        buttons: gamepad.buttons.map((button) => button.pressed || button.value >= 0.65),
      });
    }
    for (const index of this.#previous.keys())
      if (!connected.has(index)) this.#previous.delete(index);
    return active;
  }
}
