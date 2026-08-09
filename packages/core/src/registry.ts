import type { JsonObject } from '@platform/shared';

import type { Result } from './result.js';

export interface RegistryEntry<TValue> {
  readonly id: string;
  readonly metadata?: JsonObject;
  readonly value: TValue;
}

export interface Registry<TValue> {
  list(): Promise<Result<readonly RegistryEntry<TValue>[]>>;
  register(entry: RegistryEntry<TValue>): Promise<Result<void>>;
  remove(id: string): Promise<Result<void>>;
  resolve(id: string): Promise<Result<RegistryEntry<TValue>>>;
}
