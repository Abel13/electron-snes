import { readFile } from 'node:fs/promises';

import { runPluginContract } from '@platform/plugin-test';
import { expect, test } from 'vitest';

import { orbitPocketConsole } from './index.js';

test('passes the public console plugin contract', () => {
  expect(runPluginContract(orbitPocketConsole, { expectedType: 'console' })).toMatchObject({
    pluginType: 'console',
    status: 'passed',
  });
});

test('keeps the distributed manifest aligned with the definition', async () => {
  const manifest = JSON.parse(
    await readFile(new URL('../manifest.json', import.meta.url), 'utf8'),
  ) as unknown;

  expect(manifest).toEqual(orbitPocketConsole.manifest);
});
