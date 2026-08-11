import { randomUUID } from 'node:crypto';
import { mkdir, readdir, readFile, rename, stat, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { err, ok } from '@platform/core';
import type {
  BinaryStorageDomain,
  BinaryStorageEntry,
  BinaryStoragePort,
  Result,
} from '@platform/core';

const keyPattern = /^[a-z0-9-]{1,128}$/;
const maximumBytes = 16 * 1024 * 1024;

export class BinaryFileStorage implements BinaryStoragePort {
  readonly #writes = new Map<string, Promise<Result<void>>>();

  public constructor(private readonly root: string) {}

  public async list(domain: BinaryStorageDomain): Promise<Result<readonly BinaryStorageEntry[]>> {
    try {
      const directory = this.directory(domain);
      const names = await readdir(directory).catch((error: unknown) => {
        if (isMissing(error)) return [];
        throw error;
      });
      const entries = await Promise.all(
        names
          .filter((name) => name.endsWith('.bin'))
          .map(async (name) => {
            const metadata = await stat(join(directory, name));
            return {
              key: name.slice(0, -4),
              sizeBytes: metadata.size,
              updatedAt: metadata.mtime.toISOString(),
            } satisfies BinaryStorageEntry;
          }),
      );
      return ok(entries.sort((left, right) => left.key.localeCompare(right.key)));
    } catch {
      return failure('Binary storage could not list entries.');
    }
  }

  public async read(
    domain: BinaryStorageDomain,
    key: string,
  ): Promise<Result<Uint8Array | undefined>> {
    assertKey(key);
    try {
      const bytes = await readFile(this.path(domain, key));
      if (bytes.byteLength === 0 || bytes.byteLength > maximumBytes)
        return failure('The binary entry has an invalid size.');
      return ok(new Uint8Array(bytes));
    } catch (error) {
      return isMissing(error) ? ok(undefined) : failure('Binary storage could not read the entry.');
    }
  }

  public async remove(domain: BinaryStorageDomain, key: string): Promise<Result<void>> {
    assertKey(key);
    try {
      await unlink(this.path(domain, key));
      return ok(undefined);
    } catch (error) {
      return isMissing(error)
        ? ok(undefined)
        : failure('Binary storage could not remove the entry.');
    }
  }

  public write(domain: BinaryStorageDomain, key: string, value: Uint8Array): Promise<Result<void>> {
    assertKey(key);
    if (value.byteLength === 0 || value.byteLength > maximumBytes)
      return Promise.resolve(failure('The binary entry has an invalid size.'));
    const queueKey = `${domain}:${key}`;
    const previous = this.#writes.get(queueKey) ?? Promise.resolve(ok(undefined));
    const pending = previous.then(() => this.writeAtomic(domain, key, value));
    this.#writes.set(queueKey, pending);
    void pending.finally(() => {
      if (this.#writes.get(queueKey) === pending) this.#writes.delete(queueKey);
    });
    return pending;
  }

  private directory(domain: BinaryStorageDomain): string {
    return join(this.root, domain);
  }

  private path(domain: BinaryStorageDomain, key: string): string {
    return join(this.directory(domain), `${key}.bin`);
  }

  private async writeAtomic(
    domain: BinaryStorageDomain,
    key: string,
    value: Uint8Array,
  ): Promise<Result<void>> {
    const directory = this.directory(domain);
    await mkdir(directory, { recursive: true });
    const temporary = join(directory, `.${key}.${randomUUID()}.tmp`);
    try {
      await writeFile(temporary, value, { flag: 'wx', mode: 0o600 });
      await rename(temporary, this.path(domain, key));
      return ok(undefined);
    } catch {
      await unlink(temporary).catch(() => undefined);
      return failure('Binary storage could not write the entry.');
    }
  }
}

const assertKey = (key: string): void => {
  if (!keyPattern.test(key)) throw new Error('The binary storage key is invalid.');
};
const isMissing = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT';
const failure = (message: string): Result<never> => err({ code: 'unexpected', message });
