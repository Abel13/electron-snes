import type { NormalizedInputAction } from './actions.js';

export type InputDeviceKind = 'gamepad' | 'keyboard';

export interface InputDeviceDescriptor {
  readonly connected: boolean;
  readonly fingerprint: string;
  readonly id: string;
  readonly index?: number;
  readonly kind: InputDeviceKind;
  readonly label: string;
}

export interface InputFrame {
  readonly actions: readonly NormalizedInputAction[];
  readonly deviceId: string;
}

export interface GamepadButtonSnapshot {
  readonly pressed: boolean;
  readonly value: number;
}

export interface GamepadSnapshot {
  readonly axes: readonly number[];
  readonly buttons: readonly GamepadButtonSnapshot[];
  readonly connected: boolean;
  readonly id: string;
  readonly index: number;
}

export interface InputDeviceSource {
  getGamepads(): readonly (GamepadSnapshot | null)[];
}
