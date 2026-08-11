import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { BinaryFileStorage } from './binary-file-storage.js';

const directories: string[] = [];
afterEach(async () => {
  await Promise.all(
    directories.splice(0).map((path) => rm(path, { force: true, recursive: true })),
  );
});

describe('BinaryFileStorage', () => {
  it('atomically stores, lists, and removes isolated binary entries', async () => {
    const root = await mkdtemp(join(tmpdir(), 'pixelcore-binary-'));
    directories.push(root);
    const storage = new BinaryFileStorage(root);
    await expect(
      storage.write('save-states', 'game-1--slot-1', new Uint8Array([1, 2])),
    ).resolves.toEqual({ ok: true, value: undefined });
    await expect(storage.read('save-states', 'game-1--slot-1')).resolves.toEqual({
      ok: true,
      value: new Uint8Array([1, 2]),
    });
    await expect(storage.list('save-states')).resolves.toMatchObject({
      ok: true,
      value: [{ key: 'game-1--slot-1', sizeBytes: 2 }],
    });
    await storage.remove('save-states', 'game-1--slot-1');
    await expect(storage.read('save-states', 'game-1--slot-1')).resolves.toEqual({
      ok: true,
      value: undefined,
    });
  });

  it('rejects unsafe keys and oversized values', async () => {
    const storage = new BinaryFileStorage('/unused');
    await expect(storage.read('save-states', '../escape')).rejects.toThrow('key is invalid');
    await expect(storage.write('save-states', 'safe', new Uint8Array())).resolves.toMatchObject({
      ok: false,
    });
  });
});
