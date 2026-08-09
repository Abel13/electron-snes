import type { JsonObject } from '@platform/shared';

import type { Result } from './result.js';

export type LogLevel = 'debug' | 'error' | 'info' | 'warn';

export interface LogEntry {
  readonly context?: JsonObject;
  readonly level: LogLevel;
  readonly message: string;
  readonly occurredAt: string;
}

export interface Logger {
  write(entry: LogEntry): Promise<Result<void>>;
}
