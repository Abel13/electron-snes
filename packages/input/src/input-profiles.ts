import { err, ok } from '@platform/core';
import type { JsonStoragePort, Result } from '@platform/core';
import type { JsonValue } from '@platform/shared';

import { NORMALIZED_INPUT_ACTIONS, isNormalizedInputAction } from './actions.js';
import type { NormalizedInputAction } from './actions.js';
import type { ConsoleInputMapping } from './console-mapping.js';
import { validateConsoleInputMapping } from './console-mapping.js';
import { DEFAULT_GAMEPAD_BINDINGS, RESERVED_GAMEPAD_BUTTON_INDEX } from './gamepad-adapter.js';
import type { GamepadBinding } from './gamepad-adapter.js';

const PROFILE_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const KEY_CODE_PATTERN = /^[A-Za-z][A-Za-z0-9]{0,63}$/;

export interface KeyboardBinding {
  readonly code: string;
  readonly normalizedAction: NormalizedInputAction;
}

export const DEFAULT_KEYBOARD_BINDINGS: readonly KeyboardBinding[] = [
  { code: 'ArrowUp', normalizedAction: 'move-up' },
  { code: 'ArrowDown', normalizedAction: 'move-down' },
  { code: 'ArrowLeft', normalizedAction: 'move-left' },
  { code: 'ArrowRight', normalizedAction: 'move-right' },
  { code: 'KeyZ', normalizedAction: 'primary' },
  { code: 'KeyX', normalizedAction: 'secondary' },
  { code: 'Enter', normalizedAction: 'start' },
  { code: 'ShiftRight', normalizedAction: 'select' },
] as const;

export interface InputProfile {
  readonly deviceFingerprint: string;
  readonly gamepadBindings: readonly GamepadBindingSet[];
  readonly id: string;
  readonly keyboardBindings: readonly KeyboardBinding[];
  readonly mapping: ConsoleInputMapping;
  readonly name: string;
  readonly version: 3;
}

export interface GamepadBindingSet {
  readonly bindings: readonly GamepadBinding[];
  readonly deviceFingerprint: string;
}

const validateGamepadBindingSets = (input: unknown): Result<readonly GamepadBindingSet[]> => {
  if (!Array.isArray(input))
    return err({ code: 'invalid-input', message: 'Gamepad bindings must be an array.' });
  const sets: GamepadBindingSet[] = [];
  for (const value of input) {
    if (typeof value !== 'object' || value === null || Array.isArray(value))
      return err({ code: 'invalid-input', message: 'A gamepad binding set is invalid.' });
    const candidate = value as Record<string, unknown>;
    if (typeof candidate['deviceFingerprint'] !== 'string' || !Array.isArray(candidate['bindings']))
      return err({ code: 'invalid-input', message: 'A gamepad binding set is invalid.' });
    const bindings: GamepadBinding[] = [];
    for (const valueBinding of candidate['bindings']) {
      if (typeof valueBinding !== 'object' || valueBinding === null || Array.isArray(valueBinding))
        return err({ code: 'invalid-input', message: 'A gamepad binding is invalid.' });
      const binding = valueBinding as Record<string, unknown>;
      if (
        binding['kind'] !== 'button' ||
        !Number.isInteger(binding['index']) ||
        (binding['index'] as number) < 0 ||
        (binding['index'] as number) > 63 ||
        binding['index'] === RESERVED_GAMEPAD_BUTTON_INDEX ||
        !isNormalizedInputAction(binding['normalizedAction'])
      )
        return err({ code: 'invalid-input', message: 'A gamepad binding is invalid.' });
      bindings.push({
        index: binding['index'] as number,
        kind: 'button',
        normalizedAction: binding['normalizedAction'],
      });
    }
    if (
      bindings.length !== NORMALIZED_INPUT_ACTIONS.length ||
      new Set(bindings.map((binding) => binding.index)).size !== bindings.length ||
      new Set(bindings.map((binding) => binding.normalizedAction)).size !== bindings.length
    )
      return err({
        code: 'invalid-input',
        message: 'Gamepad bindings must be complete and unique.',
      });
    sets.push({ bindings, deviceFingerprint: candidate['deviceFingerprint'] });
  }
  if (new Set(sets.map((set) => set.deviceFingerprint)).size !== sets.length)
    return err({ code: 'invalid-input', message: 'Gamepad binding fingerprints must be unique.' });
  return ok(sets);
};

const validateKeyboardBindings = (input: unknown): Result<readonly KeyboardBinding[]> => {
  if (!Array.isArray(input) || input.length !== NORMALIZED_INPUT_ACTIONS.length)
    return err({ code: 'invalid-input', message: 'A complete keyboard binding set is required.' });
  const bindings: KeyboardBinding[] = [];
  for (const value of input) {
    if (
      typeof value !== 'object' ||
      value === null ||
      Array.isArray(value) ||
      typeof (value as Record<string, unknown>)['code'] !== 'string' ||
      !KEY_CODE_PATTERN.test((value as Record<string, unknown>)['code'] as string) ||
      !isNormalizedInputAction((value as Record<string, unknown>)['normalizedAction'])
    )
      return err({ code: 'invalid-input', message: 'A keyboard binding is invalid.' });
    bindings.push({
      code: (value as Record<string, unknown>)['code'] as string,
      normalizedAction: (value as Record<string, unknown>)[
        'normalizedAction'
      ] as NormalizedInputAction,
    });
  }
  if (
    new Set(bindings.map((binding) => binding.code)).size !== bindings.length ||
    new Set(bindings.map((binding) => binding.normalizedAction)).size !== bindings.length
  )
    return err({ code: 'invalid-input', message: 'Keyboard bindings must be unique.' });
  return ok(bindings);
};

export const validateInputProfile = (input: unknown): Result<InputProfile> => {
  if (typeof input !== 'object' || input === null || Array.isArray(input))
    return err({ code: 'invalid-input', message: 'An input profile object is required.' });
  const candidate = input as Record<string, unknown>;
  if (
    (candidate['version'] !== 1 && candidate['version'] !== 2 && candidate['version'] !== 3) ||
    typeof candidate['id'] !== 'string' ||
    !PROFILE_ID_PATTERN.test(candidate['id']) ||
    typeof candidate['name'] !== 'string' ||
    candidate['name'].trim().length === 0 ||
    typeof candidate['deviceFingerprint'] !== 'string' ||
    candidate['deviceFingerprint'].length === 0
  )
    return err({ code: 'invalid-input', message: 'The input profile metadata is invalid.' });
  const mapping = validateConsoleInputMapping(candidate['mapping']);
  if (!mapping.ok) return mapping;
  const keyboardBindings =
    candidate['version'] === 1
      ? ok(DEFAULT_KEYBOARD_BINDINGS)
      : validateKeyboardBindings(candidate['keyboardBindings']);
  if (!keyboardBindings.ok) return keyboardBindings;
  const gamepadBindings =
    candidate['version'] === 3 ? validateGamepadBindingSets(candidate['gamepadBindings']) : ok([]);
  if (!gamepadBindings.ok) return gamepadBindings;
  return ok({
    deviceFingerprint: candidate['deviceFingerprint'],
    gamepadBindings: gamepadBindings.value,
    id: candidate['id'],
    keyboardBindings: keyboardBindings.value.map((binding) => ({ ...binding })),
    mapping: mapping.value,
    name: candidate['name'].trim(),
    version: 3,
  });
};

const toJson = (profile: InputProfile): JsonValue => ({
  deviceFingerprint: profile.deviceFingerprint,
  gamepadBindings: profile.gamepadBindings.map((set) => ({
    bindings: set.bindings.map((binding) => ({ ...binding })),
    deviceFingerprint: set.deviceFingerprint,
  })),
  id: profile.id,
  keyboardBindings: profile.keyboardBindings.map((binding) => ({ ...binding })),
  mapping: {
    consoleId: profile.mapping.consoleId,
    entries: profile.mapping.entries.map((entry) => ({ ...entry })),
    playerPortId: profile.mapping.playerPortId,
    version: profile.mapping.version,
  },
  name: profile.name,
  version: profile.version,
});

export const bindingsForGamepad = (
  profile: InputProfile,
  deviceFingerprint: string,
): readonly GamepadBinding[] =>
  profile.gamepadBindings.find((set) => set.deviceFingerprint === deviceFingerprint)?.bindings ??
  DEFAULT_GAMEPAD_BINDINGS;

export class InputProfileRepository {
  public constructor(private readonly storage: JsonStoragePort) {}

  public async load(id: string): Promise<Result<InputProfile | undefined>> {
    const result = await this.storage.read('user-preferences', `input-profile:${id}`);
    if (!result.ok) return result;
    if (result.value === undefined) return ok(undefined);
    const profile = validateInputProfile(result.value);
    return profile.ok ? ok(profile.value) : profile;
  }

  public async save(profile: InputProfile): Promise<Result<void>> {
    const validated = validateInputProfile(profile);
    if (!validated.ok) return validated;
    return this.storage.write(
      'user-preferences',
      `input-profile:${validated.value.id}`,
      toJson(validated.value),
    );
  }
}
