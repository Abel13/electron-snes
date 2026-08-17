import { ok } from '@platform/core';
import type { JsonStorageDomain, JsonStoragePort } from '@platform/core';
import type { JsonObject, JsonValue } from '@platform/shared';
import { describe, expect, it } from 'vitest';

import { NORMALIZED_INPUT_ACTIONS } from './actions.js';
import { mapNormalizedActions, validateConsoleInputMapping } from './console-mapping.js';
import { InputDeviceDiscovery, KEYBOARD_DEVICE } from './device-discovery.js';
import {
  DEFAULT_GAMEPAD_BINDINGS,
  GamepadInputAdapter,
  readPressedGamepadButtons,
} from './gamepad-adapter.js';
import {
  GamepadPromptActivityTracker,
  classifyGamepadPromptScheme,
} from './input-prompt-scheme.js';
import {
  DEFAULT_ADVANCED_KEYBOARD_BINDINGS,
  DEFAULT_KEYBOARD_BINDINGS,
  InputProfileRepository,
  gamepadButtonForAdvancedCommand,
  keyboardCodeForAdvancedCommand,
  rebindAdvancedGamepad,
  rebindAdvancedKeyboard,
} from './input-profiles.js';
import { KeyboardInputAdapter, isCapturableKeyboardInput } from './keyboard-adapter.js';
import {
  PLATFORM_KEYBOARD_NAVIGATION_BINDINGS,
  PlatformKeyboardNavigationAdapter,
} from './platform-navigation.js';
import { PlayerAssignmentManager } from './player-assignment.js';
import { UniversalInputRuntime } from './runtime.js';

const mapping = {
  consoleId: 'org.pixelcore.fixture',
  entries: [
    { consoleAction: 'up', normalizedAction: 'move-up' },
    { consoleAction: 'down', normalizedAction: 'move-down' },
    { consoleAction: 'left', normalizedAction: 'move-left' },
    { consoleAction: 'right', normalizedAction: 'move-right' },
    { consoleAction: 'a', normalizedAction: 'primary' },
    { consoleAction: 'b', normalizedAction: 'secondary' },
    { consoleAction: 'start', normalizedAction: 'start' },
    { consoleAction: 'select', normalizedAction: 'select' },
  ],
  playerPortId: 'player-one',
  version: 1,
} as const;

class MemoryStorage implements JsonStoragePort {
  readonly values = new Map<string, JsonValue>();
  async list() {
    return ok({} as JsonObject);
  }
  async read(domain: JsonStorageDomain, key: string) {
    return ok(this.values.get(`${domain}:${key}`));
  }
  async remove(domain: JsonStorageDomain, key: string) {
    this.values.delete(`${domain}:${key}`);
    return ok(undefined);
  }
  async write(domain: JsonStorageDomain, key: string, value: JsonValue) {
    this.values.set(`${domain}:${key}`, value);
    return ok(undefined);
  }
}

describe('universal input', () => {
  it('defines stable hardware-independent actions', () => {
    expect(NORMALIZED_INPUT_ACTIONS).toEqual([
      'move-up',
      'move-down',
      'move-left',
      'move-right',
      'primary',
      'secondary',
      'left-shoulder',
      'right-shoulder',
      'start',
      'select',
    ]);
  });

  it('handles keyboard press and release without capturing editable fields', () => {
    const keyboard = new KeyboardInputAdapter();
    expect(keyboard.handle({ code: 'KeyZ', editable: true, pressed: true })).toBe(false);
    expect(keyboard.handle({ code: 'KeyZ', editable: false, pressed: true })).toBe(true);
    expect(keyboard.readActions()).toEqual(['primary']);
    keyboard.handle({ code: 'KeyZ', editable: false, pressed: false });
    expect(keyboard.readActions()).toEqual([]);
    keyboard.setBindings(
      DEFAULT_KEYBOARD_BINDINGS.map((binding) =>
        binding.normalizedAction === 'primary' ? { ...binding, code: 'KeyA' } : binding,
      ),
    );
    expect(keyboard.handle({ code: 'KeyZ', editable: false, pressed: true })).toBe(false);
    expect(keyboard.handle({ code: 'KeyA', editable: false, pressed: true })).toBe(true);
    expect(keyboard.readActions()).toEqual(['primary']);
  });

  it('keeps platform keyboard navigation separate from game bindings', () => {
    expect(PLATFORM_KEYBOARD_NAVIGATION_BINDINGS).toEqual([
      { action: 'move-up', code: 'ArrowUp' },
      { action: 'move-down', code: 'ArrowDown' },
      { action: 'move-left', code: 'ArrowLeft' },
      { action: 'move-right', code: 'ArrowRight' },
      { action: 'confirm', code: 'Enter' },
      { action: 'back', code: 'Escape' },
      { action: 'back', code: 'Backspace' },
    ]);
    const navigation = new PlatformKeyboardNavigationAdapter();
    expect(navigation.handle({ code: 'KeyZ', editable: false, pressed: true })).toBe(false);
    expect(navigation.handle({ code: 'KeyX', editable: false, pressed: true })).toBe(false);
    navigation.handle({ code: 'Enter', editable: false, pressed: true });
    navigation.handle({ code: 'Backspace', editable: false, pressed: true });
    expect(navigation.readActions()).toEqual(['back', 'confirm']);
    navigation.handle({ code: 'Enter', editable: false, pressed: false });
    navigation.handle({ code: 'Backspace', editable: false, pressed: false });
    expect(navigation.readActions()).toEqual([]);
  });

  it('accepts assignable keys and protects platform shortcuts', () => {
    const candidate = {
      altKey: false,
      code: 'KeyA',
      ctrlKey: false,
      metaKey: false,
      repeat: false,
    };
    expect(isCapturableKeyboardInput(candidate)).toBe(true);
    expect(isCapturableKeyboardInput({ ...candidate, code: 'Escape' })).toBe(false);
    expect(isCapturableKeyboardInput({ ...candidate, repeat: true })).toBe(false);
    expect(isCapturableKeyboardInput({ ...candidate, metaKey: true })).toBe(false);
    expect(isCapturableKeyboardInput({ ...candidate, ctrlKey: true })).toBe(false);
    expect(isCapturableKeyboardInput({ ...candidate, code: 'ControlLeft', ctrlKey: true })).toBe(
      true,
    );
    expect(isCapturableKeyboardInput({ ...candidate, altKey: true })).toBe(false);
    expect(isCapturableKeyboardInput({ ...candidate, code: 'AltLeft', altKey: true })).toBe(true);
  });

  it('maps standard gamepad buttons and axes without brand knowledge', () => {
    const buttons = Array.from({ length: 16 }, () => ({ pressed: false, value: 0 }));
    buttons[0] = { pressed: true, value: 1 };
    const actions = new GamepadInputAdapter().readActions({
      axes: [-0.75, 0.8],
      buttons,
      connected: true,
      id: 'Generic USB Controller',
      index: 0,
    });
    expect(actions).toEqual(['move-down', 'move-left', 'primary']);
  });
  it('classifies presentation families with an Xbox fallback', () => {
    expect(classifyGamepadPromptScheme('DualSense Wireless Controller (054c)')).toBe('playstation');
    expect(classifyGamepadPromptScheme('Xbox Wireless Controller (045e)')).toBe('xbox');
    expect(classifyGamepadPromptScheme('Generic USB Pad')).toBe('xbox');
    expect(classifyGamepadPromptScheme('')).toBe('xbox');
  });
  it('detects gamepad edges while ignoring drift and held input', () => {
    const tracker = new GamepadPromptActivityTracker();
    const buttons = Array.from({ length: 16 }, () => ({ pressed: false, value: 0 }));
    const snapshot = (axis: number, pressed = false) => ({
      axes: [axis],
      buttons: buttons.map((button, index) =>
        index === 0 ? { pressed, value: pressed ? 1 : 0 } : button,
      ),
      connected: true,
      id: 'Pad',
      index: 0,
    });
    expect(tracker.detect([snapshot(0.2)])).toBeUndefined();
    expect(tracker.detect([snapshot(0.7)])?.id).toBe('Pad');
    expect(tracker.detect([snapshot(0.8)])).toBeUndefined();
    tracker.detect([snapshot(0)]);
    expect(tracker.detect([snapshot(0, true)])?.id).toBe('Pad');
    expect(tracker.detect([snapshot(0, true)])).toBeUndefined();
  });

  it('discovers keyboards and connected gamepads deterministically', () => {
    const discovery = new InputDeviceDiscovery({
      getGamepads: () => [{ axes: [], buttons: [], connected: true, id: 'Pad', index: 0 }, null],
    });
    expect(discovery.discover().map((device) => device.id)).toEqual([
      'keyboard:standard',
      'gamepad:0',
    ]);
  });

  it('rejects assignment conflicts and restores a matching reconnect', () => {
    const assignments = new PlayerAssignmentManager();
    expect(assignments.assign('player-one', KEYBOARD_DEVICE).ok).toBe(true);
    expect(assignments.assign('player-two', KEYBOARD_DEVICE)).toMatchObject({ ok: false });
    assignments.prefer('player-one', 'gamepad:Pad');
    expect(assignments.reconcile([])).toEqual([
      { fingerprint: 'gamepad:Pad', playerPortId: 'player-one', status: 'disconnected' },
    ]);
    expect(
      assignments.reconcile([
        {
          connected: true,
          fingerprint: 'gamepad:Pad',
          id: 'gamepad:2',
          index: 2,
          kind: 'gamepad',
          label: 'Pad',
        },
      ]),
    ).toEqual([
      {
        deviceId: 'gamepad:2',
        fingerprint: 'gamepad:Pad',
        playerPortId: 'player-one',
        status: 'connected',
      },
    ]);
  });

  it('validates mappings and forwards only assigned connected actions', () => {
    const validated = validateConsoleInputMapping(mapping, [
      'up',
      'down',
      'left',
      'right',
      'a',
      'b',
      'start',
      'select',
    ]);
    expect(validated.ok).toBe(true);
    expect(mapNormalizedActions(['move-up', 'primary'], mapping)).toEqual(['a', 'up']);
    const runtime = new UniversalInputRuntime();
    runtime.assignments.prefer('player-one', KEYBOARD_DEVICE.fingerprint);
    runtime.updateDevices([KEYBOARD_DEVICE]);
    expect(
      runtime.mapPlayerActions('player-one', KEYBOARD_DEVICE.id, ['primary'], mapping),
    ).toEqual(['a']);
    runtime.updateDevices([]);
    expect(
      runtime.mapPlayerActions('player-one', KEYBOARD_DEVICE.id, ['primary'], mapping),
    ).toEqual([]);
  });

  it('persists only physical input preferences in user preferences', async () => {
    const storage = new MemoryStorage();
    const repository = new InputProfileRepository(storage);
    const profile = {
      advancedGamepadBindings: [],
      advancedKeyboardBindings: DEFAULT_ADVANCED_KEYBOARD_BINDINGS,
      deviceFingerprint: 'keyboard:standard',
      gamepadBindings: [],
      id: 'default',
      keyboardBindings: DEFAULT_KEYBOARD_BINDINGS.map((binding) => ({ ...binding })),
      name: 'Default',
      version: 5,
    } as const;
    await expect(repository.save(profile)).resolves.toEqual({ ok: true, value: undefined });
    await expect(repository.load('default')).resolves.toEqual({ ok: true, value: profile });
    expect(storage.values.get('user-preferences:input-profile:default')).not.toHaveProperty(
      'mapping',
    );
  });

  it('migrates version one input profiles with default keyboard bindings', async () => {
    const storage = new MemoryStorage();
    storage.values.set('user-preferences:input-profile:legacy', {
      deviceFingerprint: 'keyboard:standard',
      id: 'legacy',
      mapping,
      name: 'Legacy',
      version: 1,
    });
    const result = await new InputProfileRepository(storage).load('legacy');
    expect(result).toEqual({
      ok: true,
      value: {
        deviceFingerprint: 'keyboard:standard',
        advancedGamepadBindings: [],
        advancedKeyboardBindings: DEFAULT_ADVANCED_KEYBOARD_BINDINGS,
        gamepadBindings: [],
        id: 'legacy',
        keyboardBindings: DEFAULT_KEYBOARD_BINDINGS,
        name: 'Legacy',
        version: 5,
      },
    });
  });

  it('migrates advanced shortcuts and resolves device-specific defaults', async () => {
    const storage = new MemoryStorage();
    storage.values.set('user-preferences:input-profile:legacy-advanced', {
      deviceFingerprint: 'keyboard:standard',
      gamepadBindings: [],
      id: 'legacy-advanced',
      keyboardBindings: DEFAULT_KEYBOARD_BINDINGS.map((binding) => ({ ...binding })),
      mapping,
      name: 'Legacy advanced',
      version: 3,
    });
    const result = await new InputProfileRepository(storage).load('legacy-advanced');
    expect(result.ok).toBe(true);
    if (!result.ok || result.value === undefined) return;
    expect(keyboardCodeForAdvancedCommand(result.value, 'rewind')).toBe('KeyQ');
    expect(keyboardCodeForAdvancedCommand(result.value, 'fast-forward')).toBe('KeyE');
    expect(gamepadButtonForAdvancedCommand(result.value, 'generic-pad', 'rewind')).toBe(6);
    expect(gamepadButtonForAdvancedCommand(result.value, 'generic-pad', 'fast-forward')).toBe(7);
  });

  it('swaps conflicting advanced shortcuts and preserves reserved menu input', () => {
    expect(rebindAdvancedKeyboard(DEFAULT_ADVANCED_KEYBOARD_BINDINGS, 'rewind', 'KeyE')).toEqual([
      { code: 'KeyE', command: 'rewind' },
      { code: 'KeyQ', command: 'fast-forward' },
    ]);
    const defaults = [
      { command: 'rewind' as const, index: 6, kind: 'button' as const },
      { command: 'fast-forward' as const, index: 7, kind: 'button' as const },
    ];
    expect(rebindAdvancedGamepad(defaults, 'rewind', 7)).toEqual([
      { command: 'rewind', index: 7, kind: 'button' },
      { command: 'fast-forward', index: 6, kind: 'button' },
    ]);
    expect(rebindAdvancedGamepad(defaults, 'rewind', 9)).toBe(defaults);
  });

  it('maps and captures physical gamepad buttons with a reserved menu button', () => {
    const buttons = Array.from({ length: 16 }, () => ({ pressed: false, value: 0 }));
    buttons[4] = { pressed: true, value: 1 };
    buttons[9] = { pressed: true, value: 1 };
    const snapshot = { axes: [], buttons, connected: true, id: 'Pad', index: 0 };
    expect(readPressedGamepadButtons(snapshot)).toEqual([4, 9]);
    expect(new GamepadInputAdapter().readActions(snapshot, DEFAULT_GAMEPAD_BINDINGS)).toContain(
      'select',
    );
  });
});
