import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { afterEach, describe, expect, it } from 'vitest';

import { CartridgeSaveStore } from './cartridge-save-store.js';

const directories: string[] = [];

afterEach(async () => {
  await Promise.all(
    directories.splice(0).map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

describe('CartridgeSaveStore', () => {
  it('atomically persists and restores binary cartridge data', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'pixelcore-save-'));
    directories.push(directory);
    const store = new CartridgeSaveStore(directory);
    const key = 'c'.repeat(64);

    await store.write(key, new Uint8Array([1, 2, 3]));

    await expect(store.read(key)).resolves.toEqual(new Uint8Array([1, 2, 3]));
    await expect(readFile(join(directory, `${key}.sav`))).resolves.toEqual(Buffer.from([1, 2, 3]));
  });

  it('serializes writes and preserves the newest complete save', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'pixelcore-save-'));
    directories.push(directory);
    const store = new CartridgeSaveStore(directory);
    const key = 'd'.repeat(64);

    await Promise.all([
      store.write(key, new Uint8Array([1])),
      store.write(key, new Uint8Array([2])),
    ]);

    await expect(store.read(key)).resolves.toEqual(new Uint8Array([2]));
  });

  it('rejects unsafe keys and invalid existing files', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'pixelcore-save-'));
    directories.push(directory);
    const store = new CartridgeSaveStore(directory);
    await expect(store.read('../escape')).rejects.toThrow('key is invalid');
    const key = 'e'.repeat(64);
    await writeFile(join(directory, `${key}.sav`), new Uint8Array());
    await expect(store.read(key)).rejects.toThrow('invalid size');
  });
});
