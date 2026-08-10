import type { NormalizedInputAction } from './actions.js';
import type { ConsoleInputMapping } from './console-mapping.js';
import { mapNormalizedActions } from './console-mapping.js';
import type { InputDeviceDescriptor } from './devices.js';
import { PlayerAssignmentManager } from './player-assignment.js';

export class UniversalInputRuntime {
  readonly assignments = new PlayerAssignmentManager();
  #connectedDevices = new Set<string>();

  public updateDevices(devices: readonly InputDeviceDescriptor[]): void {
    this.#connectedDevices = new Set(
      devices.filter((device) => device.connected).map((device) => device.id),
    );
    this.assignments.reconcile(devices);
  }

  public mapPlayerActions(
    playerPortId: string,
    deviceId: string,
    actions: readonly NormalizedInputAction[],
    mapping: ConsoleInputMapping,
  ): readonly string[] {
    if (
      !this.#connectedDevices.has(deviceId) ||
      this.assignments.resolveDeviceId(playerPortId) !== deviceId ||
      mapping.playerPortId !== playerPortId
    )
      return [];
    return mapNormalizedActions(actions, mapping);
  }
}
