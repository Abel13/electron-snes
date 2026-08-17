export const PLATFORM_NAVIGATION_ACTIONS = [
  'move-up',
  'move-down',
  'move-left',
  'move-right',
  'confirm',
  'back',
] as const;

export type PlatformNavigationAction = (typeof PLATFORM_NAVIGATION_ACTIONS)[number];

export interface PlatformKeyboardNavigationBinding {
  readonly action: PlatformNavigationAction;
  readonly code: string;
}

export const PLATFORM_KEYBOARD_NAVIGATION_BINDINGS: readonly PlatformKeyboardNavigationBinding[] = [
  { action: 'move-up', code: 'ArrowUp' },
  { action: 'move-down', code: 'ArrowDown' },
  { action: 'move-left', code: 'ArrowLeft' },
  { action: 'move-right', code: 'ArrowRight' },
  { action: 'confirm', code: 'Enter' },
  { action: 'back', code: 'Escape' },
  { action: 'back', code: 'Backspace' },
] as const;

export class PlatformKeyboardNavigationAdapter {
  readonly #pressed = new Set<PlatformNavigationAction>();
  readonly #mapping = new Map(
    PLATFORM_KEYBOARD_NAVIGATION_BINDINGS.map((binding) => [binding.code, binding.action] as const),
  );

  public handle(event: {
    readonly code: string;
    readonly editable: boolean;
    readonly pressed: boolean;
  }): boolean {
    const action = this.#mapping.get(event.code);
    if (action === undefined || event.editable) return false;
    if (event.pressed) this.#pressed.add(action);
    else this.#pressed.delete(action);
    return true;
  }

  public readActions(): readonly PlatformNavigationAction[] {
    return [...this.#pressed].sort();
  }

  public reset(): void {
    this.#pressed.clear();
  }
}
