import { err, ok } from '@platform/core';
import type { Result } from '@platform/core';

import type { InputDeviceDescriptor } from './devices.js';

export interface PlayerAssignment {
  readonly deviceId?: string;
  readonly fingerprint: string;
  readonly playerPortId: string;
  readonly status: 'connected' | 'disconnected';
}

export class PlayerAssignmentManager {
  readonly #preferred = new Map<string, string>();
  readonly #resolved = new Map<string, string>();

  public assign(playerPortId: string, device: InputDeviceDescriptor): Result<PlayerAssignment> {
    const conflict = [...this.#resolved].find(
      ([assignedPlayer, deviceId]) => assignedPlayer !== playerPortId && deviceId === device.id,
    );
    if (conflict !== undefined)
      return err({
        code: 'conflict',
        message: `The input device is already assigned to ${conflict[0]}.`,
      });

    this.#preferred.set(playerPortId, device.fingerprint);
    this.#resolved.set(playerPortId, device.id);
    return ok({
      deviceId: device.id,
      fingerprint: device.fingerprint,
      playerPortId,
      status: 'connected',
    });
  }

  public prefer(playerPortId: string, fingerprint: string): void {
    this.#preferred.set(playerPortId, fingerprint);
  }

  public reconcile(devices: readonly InputDeviceDescriptor[]): readonly PlayerAssignment[] {
    this.#resolved.clear();
    const claimed = new Set<string>();
    return [...this.#preferred]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([playerPortId, fingerprint]) => {
        const device = devices.find(
          (candidate) => candidate.fingerprint === fingerprint && !claimed.has(candidate.id),
        );
        if (device === undefined)
          return { fingerprint, playerPortId, status: 'disconnected' as const };
        claimed.add(device.id);
        this.#resolved.set(playerPortId, device.id);
        return {
          deviceId: device.id,
          fingerprint,
          playerPortId,
          status: 'connected' as const,
        };
      });
  }

  public resolveDeviceId(playerPortId: string): string | undefined {
    return this.#resolved.get(playerPortId);
  }
}
