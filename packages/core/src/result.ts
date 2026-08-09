import type { JsonObject } from '@platform/shared';

export type CoreErrorCode =
  | 'conflict'
  | 'event-delivery-failed'
  | 'forbidden'
  | 'invalid-input'
  | 'not-found'
  | 'unexpected'
  | 'unavailable';

export interface CoreError {
  readonly code: CoreErrorCode;
  readonly details?: JsonObject;
  readonly message: string;
}

export interface Ok<T> {
  readonly ok: true;
  readonly value: T;
}

export interface Err<E extends CoreError> {
  readonly error: E;
  readonly ok: false;
}

export type Result<T, E extends CoreError = CoreError> = Err<E> | Ok<T>;

export const err = <E extends CoreError>(error: E): Err<E> => ({ error, ok: false });

export const ok = <T>(value: T): Ok<T> => ({ ok: true, value });
