import type { JsonObject, JsonValue } from '@platform/shared';

import type { Result } from './result.js';

export type ConfigurationNamespace = string;

export interface ConfigurationStore {
  list(namespace: ConfigurationNamespace): Promise<Result<JsonObject>>;
  read(namespace: ConfigurationNamespace, key: string): Promise<Result<JsonValue | undefined>>;
  remove(namespace: ConfigurationNamespace, key: string): Promise<Result<void>>;
  write(namespace: ConfigurationNamespace, key: string, value: JsonValue): Promise<Result<void>>;
}
