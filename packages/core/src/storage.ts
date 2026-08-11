import type { JsonObject, JsonValue } from '@platform/shared';

import type { Result } from './result.js';

export type JsonStorageDomain =
  | 'application-configuration'
  | 'cache'
  | 'game-library'
  | 'plugin-configuration'
  | 'user-preferences';

export type BinaryStorageDomain = 'game-saves' | 'save-states';

export interface BinaryStorageEntry {
  readonly key: string;
  readonly sizeBytes: number;
  readonly updatedAt: string;
}

export interface BinaryStoragePort {
  list(domain: BinaryStorageDomain): Promise<Result<readonly BinaryStorageEntry[]>>;
  read(domain: BinaryStorageDomain, key: string): Promise<Result<Uint8Array | undefined>>;
  remove(domain: BinaryStorageDomain, key: string): Promise<Result<void>>;
  write(domain: BinaryStorageDomain, key: string, value: Uint8Array): Promise<Result<void>>;
}

export interface JsonStoragePort {
  list(domain: JsonStorageDomain): Promise<Result<JsonObject>>;
  read(domain: JsonStorageDomain, key: string): Promise<Result<JsonValue | undefined>>;
  remove(domain: JsonStorageDomain, key: string): Promise<Result<void>>;
  write(domain: JsonStorageDomain, key: string, value: JsonValue): Promise<Result<void>>;
}
