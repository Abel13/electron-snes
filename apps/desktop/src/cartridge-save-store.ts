import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

const saveKeyPattern = /^[a-f0-9]{64}$/;
const maximumSaveBytes = 1024 * 1024;

export class CartridgeSaveStore {
  readonly #writes = new Map<string, Promise<void>>();

  public constructor(private readonly directory: string) {}

  public async read(key: string): Promise<Uint8Array | undefined> {
    assertSaveKey(key);
    try {
      const bytes = await readFile(this.pathFor(key));
      if (bytes.byteLength === 0 || bytes.byteLength > maximumSaveBytes)
        throw new Error('The cartridge save has an invalid size.');
      return new Uint8Array(bytes);
    } catch (error) {
      if (isMissingFile(error)) return undefined;
      throw error;
    }
  }

  public write(key: string, bytes: Uint8Array): Promise<void> {
    assertSaveKey(key);
    if (bytes.byteLength === 0 || bytes.byteLength > maximumSaveBytes)
      return Promise.reject(new Error('The cartridge save has an invalid size.'));

    const previous = this.#writes.get(key) ?? Promise.resolve();
    const pending = previous.catch(() => undefined).then(() => this.writeAtomic(key, bytes));
    this.#writes.set(key, pending);
    const cleanup = (): void => {
      if (this.#writes.get(key) === pending) this.#writes.delete(key);
    };
    void pending.then(cleanup, cleanup);
    return pending;
  }

  private pathFor(key: string): string {
    return join(this.directory, `${key}.sav`);
  }

  private async writeAtomic(key: string, bytes: Uint8Array): Promise<void> {
    await mkdir(this.directory, { recursive: true });
    const temporary = join(this.directory, `.${key}.${randomUUID()}.tmp`);
    try {
      await writeFile(temporary, bytes, { flag: 'wx', mode: 0o600 });
      await rename(temporary, this.pathFor(key));
    } catch (error) {
      await unlink(temporary).catch(() => undefined);
      throw error;
    }
  }
}

const assertSaveKey = (key: string): void => {
  if (!saveKeyPattern.test(key)) throw new Error('The cartridge save key is invalid.');
};

const isMissingFile = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT';
