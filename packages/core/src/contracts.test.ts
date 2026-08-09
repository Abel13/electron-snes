import { expect, expectTypeOf, test } from 'vitest';

import { err, ok } from './index.js';
import type {
  ConfigurationStore,
  EventBus,
  EventEnvelope,
  JsonStoragePort,
  LifecycleService,
  Logger,
  PermissionRequest,
  Registry,
  Result,
  ServiceStatus,
} from './index.js';

type CoreEvents = {
  readonly serviceStarted: {
    readonly serviceId: string;
  };
};

test('models successful and failed results as a discriminated union', () => {
  const success: Result<string> = ok('ready');
  const failure: Result<string> = err({ code: 'unavailable', message: 'Unavailable' });

  expect(success.ok).toBe(true);
  expect(failure.ok).toBe(false);
  expectTypeOf(success).toMatchTypeOf<Result<string>>();
  expectTypeOf(failure).toMatchTypeOf<Result<string>>();
});

test('keeps core contracts asynchronous and JSON-safe', () => {
  const event: EventEnvelope<CoreEvents, 'serviceStarted'> = {
    occurredAt: '2026-08-09T00:00:00.000Z',
    payload: { serviceId: 'core' },
    type: 'serviceStarted',
  };

  expect(event.type).toBe('serviceStarted');
  expectTypeOf<EventBus<CoreEvents>>().toHaveProperty('publish');
  expectTypeOf<LifecycleService>().toHaveProperty('getStatus');
  expectTypeOf<Registry<string>>().toHaveProperty('register');
  expectTypeOf<ConfigurationStore>().toHaveProperty('write');
  expectTypeOf<JsonStoragePort>().toHaveProperty('write');
  expectTypeOf<Logger>().toHaveProperty('write');
  expectTypeOf<PermissionRequest['actions']>().toEqualTypeOf<
    readonly ('execute' | 'list' | 'read' | 'write')[]
  >();
  expectTypeOf<ServiceStatus>().toEqualTypeOf<
    'failed' | 'idle' | 'running' | 'starting' | 'stopped' | 'stopping'
  >();
});
