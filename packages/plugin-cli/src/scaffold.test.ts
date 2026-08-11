import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, expect, test } from 'vitest';

import { createPluginScaffold } from './scaffold.js';

const directories: string[] = [];

afterEach(async () => {
  await Promise.all(
    directories.splice(0).map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

const temporaryDirectory = async (): Promise<string> => {
  const directory = await mkdtemp(join(tmpdir(), 'pixelcore-plugin-'));
  directories.push(directory);
  return directory;
};

test.each(['console', 'controller', 'game-metadata'] as const)(
  'creates a complete %s scaffold',
  async (type) => {
    const cwd = await temporaryDirectory();
    const result = await createPluginScaffold({
      cwd,
      id: `org.example.${type.replace('-', '.')}`,
      name: `Example ${type}`,
      output: 'plugin',
      type,
    });
    expect(result.files).toEqual([
      'README.md',
      'manifest.json',
      'package.json',
      'src/contract.test.ts',
      'src/index.ts',
      'tsconfig.build.json',
      'tsconfig.json',
    ]);
    expect(
      JSON.parse(await readFile(join(result.directory, 'manifest.json'), 'utf8')),
    ).toMatchObject({ type });
  },
);

test('rejects invalid plugin IDs before writing', async () => {
  const cwd = await temporaryDirectory();
  await expect(
    createPluginScaffold({
      cwd,
      id: 'invalid',
      name: 'Invalid',
      output: 'plugin',
      type: 'console',
    }),
  ).rejects.toThrow('Invalid plugin identity');
});

test('refuses to overwrite an existing directory', async () => {
  const cwd = await temporaryDirectory();
  await createPluginScaffold({
    cwd,
    id: 'org.example.first',
    name: 'First',
    output: 'plugin',
    type: 'console',
  });
  await expect(
    createPluginScaffold({
      cwd,
      id: 'org.example.second',
      name: 'Second',
      output: 'plugin',
      type: 'console',
    }),
  ).rejects.toThrow('Refusing to overwrite');
});
