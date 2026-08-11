import { expect, test } from 'vitest';

import { InMemoryLogger } from './logging.js';

test('retains structured JSON-safe log entries in write order', async () => {
  const logger = new InMemoryLogger();
  const entry = {
    context: { pluginId: 'org.example.controller' },
    level: 'info' as const,
    message: 'Plugin registered.',
    occurredAt: '2026-08-09T00:00:00.000Z',
  };

  expect(await logger.write(entry)).toEqual({ ok: true, value: undefined });
  expect(await logger.list()).toEqual({ ok: true, value: [entry] });
});

test('keeps only the most recent entries within its fixed capacity', async () => {
  const logger = new InMemoryLogger(2);

  await logger.write({ level: 'debug', message: 'first', occurredAt: '2026-08-09T00:00:00.000Z' });
  await logger.write({ level: 'info', message: 'second', occurredAt: '2026-08-09T00:00:01.000Z' });
  await logger.write({ level: 'warn', message: 'third', occurredAt: '2026-08-09T00:00:02.000Z' });

  expect(await logger.list()).toEqual({
    ok: true,
    value: [
      { level: 'info', message: 'second', occurredAt: '2026-08-09T00:00:01.000Z' },
      { level: 'warn', message: 'third', occurredAt: '2026-08-09T00:00:02.000Z' },
    ],
  });
});

test('returns a list snapshot without exposing the retained array', async () => {
  const logger = new InMemoryLogger();

  await logger.write({
    level: 'error',
    message: 'failure',
    occurredAt: '2026-08-09T00:00:00.000Z',
  });

  const firstRead = await logger.list();

  if (!firstRead.ok) {
    throw new Error('Expected an in-memory log list.');
  }

  const mutableSnapshot = [...firstRead.value];
  mutableSnapshot.pop();

  expect(await logger.list()).toMatchObject({
    ok: true,
    value: [{ level: 'error', message: 'failure' }],
  });
});
