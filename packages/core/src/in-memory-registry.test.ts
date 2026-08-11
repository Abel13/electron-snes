import { expect, test } from 'vitest';

import { InMemoryRegistry } from './registry.js';

test('lists registered entries in deterministic identifier order', async () => {
  const registry = new InMemoryRegistry<number>();

  await registry.register({ id: 'plugin.zeta', value: 3 });
  await registry.register({ id: 'plugin.alpha', value: 1 });
  await registry.register({ id: 'plugin.beta', value: 2 });

  const listed = await registry.list();
  const resolved = await registry.resolve('plugin.beta');

  expect(listed).toEqual({
    ok: true,
    value: [
      { id: 'plugin.alpha', value: 1 },
      { id: 'plugin.beta', value: 2 },
      { id: 'plugin.zeta', value: 3 },
    ],
  });
  expect(resolved).toEqual({ ok: true, value: { id: 'plugin.beta', value: 2 } });
});

test('rejects duplicate identifiers without replacing the existing entry', async () => {
  const registry = new InMemoryRegistry<string>();

  await registry.register({ id: 'plugin.example', value: 'original' });
  const duplicate = await registry.register({ id: 'plugin.example', value: 'replacement' });
  const resolved = await registry.resolve('plugin.example');

  expect(duplicate).toEqual({
    error: {
      code: 'conflict',
      details: { id: 'plugin.example' },
      message: 'A registry entry already exists for this identifier.',
    },
    ok: false,
  });
  expect(resolved).toEqual({ ok: true, value: { id: 'plugin.example', value: 'original' } });
});

test('returns not-found for unknown resolution and removal', async () => {
  const registry = new InMemoryRegistry<never>();

  await registry.register({ id: 'plugin.example', value: undefined as never });
  await registry.remove('plugin.example');

  expect(await registry.resolve('plugin.example')).toMatchObject({
    error: { code: 'not-found', details: { id: 'plugin.example' } },
    ok: false,
  });
  expect(await registry.remove('plugin.example')).toMatchObject({
    error: { code: 'not-found', details: { id: 'plugin.example' } },
    ok: false,
  });
});
