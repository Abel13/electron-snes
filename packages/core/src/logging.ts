import type { JsonObject } from '@platform/shared';

import { ok } from './result.js';
import type { Result } from './result.js';

export type LogLevel = 'debug' | 'error' | 'info' | 'warn';

export const DEFAULT_IN_MEMORY_LOG_CAPACITY = 500;

export interface LogEntry {
  readonly context?: JsonObject;
  readonly level: LogLevel;
  readonly message: string;
  readonly occurredAt: string;
}

export interface Logger {
  write(entry: LogEntry): Promise<Result<void>>;
}

export class InMemoryLogger implements Logger {
  readonly #capacity: number;
  readonly #entries: LogEntry[] = [];

  constructor(capacity = DEFAULT_IN_MEMORY_LOG_CAPACITY) {
    this.#capacity = Math.max(1, Math.floor(capacity));
  }

  async list(): Promise<Result<readonly LogEntry[]>> {
    return ok([...this.#entries]);
  }

  async write(entry: LogEntry): Promise<Result<void>> {
    this.#entries.push(entry);

    if (this.#entries.length > this.#capacity) {
      this.#entries.splice(0, this.#entries.length - this.#capacity);
    }

    return ok(undefined);
  }
}
