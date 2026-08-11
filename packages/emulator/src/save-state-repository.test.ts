import { err, ok } from '@platform/core';
import type { BinaryStorageDomain, BinaryStorageEntry, BinaryStoragePort } from '@platform/core';
import { describe, expect, it } from 'vitest';

import { SaveStateRepository } from './save-state-repository.js';

class MemoryBinaryStorage implements BinaryStoragePort {
  readonly values = new Map<string, Uint8Array>();
  list() {
    return Promise.resolve(
      ok(
        [...this.values].map(([key, value]): BinaryStorageEntry => ({
          key,
          sizeBytes: value.byteLength,
          updatedAt: '2026-08-11T00:00:00.000Z',
        })),
      ),
    );
  }
  read(_domain: BinaryStorageDomain, key: string) {
    return Promise.resolve(ok(this.values.get(key)));
  }
  remove(_domain: BinaryStorageDomain, key: string) {
    this.values.delete(key);
    return Promise.resolve(ok(undefined));
  }
  write(_domain: BinaryStorageDomain, key: string, value: Uint8Array) {
    this.values.set(key, value.slice());
    return Promise.resolve(ok(undefined));
  }
}

describe('SaveStateRepository', () => {
  it('round-trips opaque states and lists known slots', async () => {
    const storage = new MemoryBinaryStorage();
    const repository = new SaveStateRepository(storage);
    await repository.write('game-1', 'slot-2', {
      bytes: new Uint8Array([4, 2]),
      coreId: 'org.pixelcore.sameboy',
      formatVersion: 1,
    });
    await expect(repository.read('game-1', 'slot-2')).resolves.toEqual(
      ok({ bytes: new Uint8Array([4, 2]), coreId: 'org.pixelcore.sameboy', formatVersion: 1 }),
    );
    await expect(repository.list('game-1')).resolves.toEqual(
      ok([{ sizeBytes: 33, slot: 'slot-2', updatedAt: '2026-08-11T00:00:00.000Z' }]),
    );
  });

  it('rejects malformed envelopes without returning bytes', async () => {
    const storage = new MemoryBinaryStorage();
    storage.values.set('game-1--autosave', new Uint8Array([1, 2, 3]));
    await expect(new SaveStateRepository(storage).read('game-1', 'autosave')).resolves.toEqual(
      err({ code: 'invalid-input', message: 'The stored save state is invalid.' }),
    );
  });
});
