import type { JsonObject, JsonValue } from '@platform/shared';

import type { Result } from './result.js';

export type JsonStorageDomain =
  | 'application-configuration'
  | 'cache'
  | 'game-library'
  | 'plugin-configuration'
  | 'user-preferences';

export interface JsonStoragePort {
  list(domain: JsonStorageDomain): Promise<Result<JsonObject>>;
  read(domain: JsonStorageDomain, key: string): Promise<Result<JsonValue | undefined>>;
  remove(domain: JsonStorageDomain, key: string): Promise<Result<void>>;
  write(domain: JsonStorageDomain, key: string, value: JsonValue): Promise<Result<void>>;
}
