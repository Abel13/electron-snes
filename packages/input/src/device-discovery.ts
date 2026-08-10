import type { InputDeviceDescriptor, InputDeviceSource } from './devices.js';

export const KEYBOARD_DEVICE: InputDeviceDescriptor = {
  connected: true,
  fingerprint: 'keyboard:standard',
  id: 'keyboard:standard',
  kind: 'keyboard',
  label: 'Keyboard',
};

export class InputDeviceDiscovery {
  public constructor(private readonly source: InputDeviceSource) {}

  public discover(): readonly InputDeviceDescriptor[] {
    const gamepads = this.source
      .getGamepads()
      .filter((gamepad) => gamepad?.connected === true)
      .map((gamepad): InputDeviceDescriptor => ({
        connected: true,
        fingerprint: `gamepad:${gamepad!.id}`,
        id: `gamepad:${gamepad!.index}`,
        index: gamepad!.index,
        kind: 'gamepad',
        label: gamepad!.id.trim() || `Gamepad ${gamepad!.index + 1}`,
      }))
      .sort((left, right) => left.id.localeCompare(right.id));
    return [KEYBOARD_DEVICE, ...gamepads];
  }
}
