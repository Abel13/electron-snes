import type { NormalizedInputAction } from './actions.js';
import { DEFAULT_KEYBOARD_BINDINGS } from './input-profiles.js';
import type { KeyboardBinding } from './input-profiles.js';

export interface KeyboardInputEvent {
  readonly code: string;
  readonly editable: boolean;
  readonly pressed: boolean;
}

export interface KeyboardCaptureCandidate {
  readonly altKey: boolean;
  readonly code: string;
  readonly ctrlKey: boolean;
  readonly metaKey: boolean;
  readonly repeat: boolean;
}

export const isCapturableKeyboardInput = (candidate: KeyboardCaptureCandidate): boolean => {
  if (candidate.code === 'Escape' || candidate.repeat || candidate.metaKey) return false;
  const isolatedControl =
    candidate.code === 'ControlLeft' || candidate.code === 'ControlRight';
  const isolatedAlt = candidate.code === 'AltLeft' || candidate.code === 'AltRight';
  return !(
    (candidate.ctrlKey && !isolatedControl) ||
    (candidate.altKey && !isolatedAlt)
  );
};

export class KeyboardInputAdapter {
  readonly #pressed = new Set<NormalizedInputAction>();
  #mapping = new Map<string, NormalizedInputAction>();

  public constructor(bindings: readonly KeyboardBinding[] = DEFAULT_KEYBOARD_BINDINGS) {
    this.setBindings(bindings);
  }

  public handle(event: KeyboardInputEvent): boolean {
    const action = this.#mapping.get(event.code);
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

  public setBindings(bindings: readonly KeyboardBinding[]): void {
    this.reset();
    this.#mapping = new Map(
      bindings.map((binding) => [binding.code, binding.normalizedAction] as const),
    );
  }
}
