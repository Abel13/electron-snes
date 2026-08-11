import { expectTypeOf, test } from 'vitest';

import type {
  BinaryStorageDomain,
  BinaryStorageEntry,
  BinaryStoragePort,
  JsonStorageDomain,
  JsonStoragePort,
  Result,
} from './index.js';

test('keeps JSON and binary storage domains separate', () => {
  expectTypeOf<JsonStorageDomain>().toEqualTypeOf<
    | 'application-configuration'
    | 'cache'
    | 'game-library'
    | 'plugin-configuration'
    | 'user-preferences'
  >();
  expectTypeOf<BinaryStorageDomain>().toEqualTypeOf<'game-saves' | 'save-states'>();
  expectTypeOf<BinaryStoragePort>().toHaveProperty('read');
  expectTypeOf<JsonStoragePort>().toHaveProperty('write');
});

test('models binary reads, entries, and failures through public contracts', () => {
  expectTypeOf<BinaryStoragePort['read']>().returns.toEqualTypeOf<
    Promise<Result<Uint8Array | undefined>>
  >();
  expectTypeOf<BinaryStoragePort['list']>().returns.toEqualTypeOf<
    Promise<Result<readonly BinaryStorageEntry[]>>
  >();
  expectTypeOf<BinaryStorageEntry>().toMatchTypeOf<{
    readonly key: string;
    readonly sizeBytes: number;
    readonly updatedAt: string;
  }>();
});
