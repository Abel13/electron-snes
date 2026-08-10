import type { NormalizedInputAction } from './actions.js';

const DEFAULT_KEYBOARD_MAPPING: Readonly<Record<string, NormalizedInputAction>> = {
  ArrowDown: 'move-down',
  ArrowLeft: 'move-left',
  ArrowRight: 'move-right',
  ArrowUp: 'move-up',
  Backspace: 'select',
  Enter: 'start',
  KeyX: 'secondary',
  KeyZ: 'primary',
  ShiftRight: 'select',
};

export interface KeyboardInputEvent {
  readonly code: string;
  readonly editable: boolean;
  readonly pressed: boolean;
}

export class KeyboardInputAdapter {
  readonly #pressed = new Set<NormalizedInputAction>();

  public constructor(
    private readonly mapping: Readonly<
      Record<string, NormalizedInputAction>
    > = DEFAULT_KEYBOARD_MAPPING,
  ) {}

  public handle(event: KeyboardInputEvent): boolean {
    const action = this.mapping[event.code];
    if (action === undefined || event.editable) return false;
    if (event.pressed) this.#pressed.add(action);
    else this.#pressed.delete(action);
    return true;
  }

  public readActions(): readonly NormalizedInputAction[] {
    return [...this.#pressed].sort();
  }

  public reset(): void {
    this.#pressed.clear();
  }
}
