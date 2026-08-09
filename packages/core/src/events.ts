import type { JsonValue } from '@platform/shared';

import type { Result } from './result.js';

export type JsonEventMap<TEventMap extends object> = {
  readonly [TEventType in keyof TEventMap]: JsonValue;
};

export interface EventEnvelope<
  TEventMap extends JsonEventMap<TEventMap>,
  TEventType extends keyof TEventMap,
> {
  readonly occurredAt: string;
  readonly payload: TEventMap[TEventType];
  readonly type: TEventType;
}

export type EventHandler<
  TEventMap extends JsonEventMap<TEventMap>,
  TEventType extends keyof TEventMap,
> = (event: EventEnvelope<TEventMap, TEventType>) => Promise<void> | void;

export type Unsubscribe = () => void;

export interface EventBus<TEventMap extends JsonEventMap<TEventMap>> {
  publish<TEventType extends keyof TEventMap>(
    event: EventEnvelope<TEventMap, TEventType>,
  ): Promise<Result<void>>;
  subscribe<TEventType extends keyof TEventMap>(
    eventType: TEventType,
    handler: EventHandler<TEventMap, TEventType>,
  ): Unsubscribe;
}
