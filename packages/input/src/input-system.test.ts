import { ok } from '@platform/core';
import type { JsonStorageDomain, JsonStoragePort } from '@platform/core';
import type { JsonObject, JsonValue } from '@platform/shared';
import { describe, expect, it } from 'vitest';

import { NORMALIZED_INPUT_ACTIONS } from './actions.js';
import { validateConsoleInputMapping, mapNormalizedActions } from './console-mapping.js';
import { InputDeviceDiscovery, KEYBOARD_DEVICE } from './device-discovery.js';
import { GamepadInputAdapter } from './gamepad-adapter.js';
import { InputProfileRepository } from './input-profiles.js';
import { KeyboardInputAdapter } from './keyboard-adapter.js';
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

  it('persists input profiles in user preferences', async () => {
    const storage = new MemoryStorage();
    const repository = new InputProfileRepository(storage);
    const profile = {
      deviceFingerprint: 'keyboard:standard',
      id: 'default',
      mapping,
      name: 'Default',
      version: 1,
    } as const;
    await expect(repository.save(profile)).resolves.toEqual({ ok: true, value: undefined });
    await expect(repository.load('default')).resolves.toEqual({ ok: true, value: profile });
  });
});
