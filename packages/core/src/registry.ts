import type { JsonObject } from '@platform/shared';

import { err, ok } from './result.js';
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

export class InMemoryRegistry<TValue> implements Registry<TValue> {
  readonly #entries = new Map<string, RegistryEntry<TValue>>();

  async list(): Promise<Result<readonly RegistryEntry<TValue>[]>> {
    return ok(
      [...this.#entries.values()].sort((left, right) => {
        if (left.id < right.id) {
          return -1;
        }

        if (left.id > right.id) {
          return 1;
        }

        return 0;
      }),
    );
  }

  async register(entry: RegistryEntry<TValue>): Promise<Result<void>> {
    if (this.#entries.has(entry.id)) {
      return err({
        code: 'conflict',
        details: { id: entry.id },
        message: 'A registry entry already exists for this identifier.',
      });
    }

    this.#entries.set(entry.id, entry);
    return ok(undefined);
  }

  async remove(id: string): Promise<Result<void>> {
    if (!this.#entries.delete(id)) {
      return err({
        code: 'not-found',
        details: { id },
        message: 'No registry entry exists for this identifier.',
      });
    }

    return ok(undefined);
  }

  async resolve(id: string): Promise<Result<RegistryEntry<TValue>>> {
    const entry = this.#entries.get(id);

    if (entry === undefined) {
      return err({
        code: 'not-found',
        details: { id },
        message: 'No registry entry exists for this identifier.',
      });
    }

    return ok(entry);
  }
}
