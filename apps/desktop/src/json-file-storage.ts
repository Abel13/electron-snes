import { err, ok } from '@platform/core';
import type { JsonStorageDomain, JsonStoragePort, Result } from '@platform/core';
import type { JsonObject, JsonValue } from '@platform/shared';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

type StorageData = Partial<Record<JsonStorageDomain, Record<string, JsonValue>>>;

const isJsonValue = (value: unknown): value is JsonValue => {
  if (value === null || ['boolean', 'number', 'string'].includes(typeof value)) return true;
  if (Array.isArray(value)) return value.every(isJsonValue);
  return typeof value === 'object' && value !== null && Object.values(value).every(isJsonValue);
};

const failure = (message: string): Result<never> => err({ code: 'unexpected', message });

export class JsonFileStorage implements JsonStoragePort {
  private mutations: Promise<void> = Promise.resolve();

  public constructor(private readonly filePath: string) {}

  public async list(domain: JsonStorageDomain): Promise<Result<JsonObject>> {
    const data = await this.readData();
    return data.ok ? ok(data.value[domain] ?? {}) : data;
  }

  public async read(
    domain: JsonStorageDomain,
    key: string,
  ): Promise<Result<JsonValue | undefined>> {
    const data = await this.readData();
    return data.ok ? ok(data.value[domain]?.[key]) : data;
  }

  public async remove(domain: JsonStorageDomain, key: string): Promise<Result<void>> {
    return this.mutate(async () => {
      const data = await this.readData();
      if (!data.ok) return data;
      const domainData = { ...(data.value[domain] ?? {}) };
      delete domainData[key];
      return this.writeData({ ...data.value, [domain]: domainData });
    });
  }

  public async write(
    domain: JsonStorageDomain,
    key: string,
    value: JsonValue,
  ): Promise<Result<void>> {
    return this.mutate(async () => {
      const data = await this.readData();
      if (!data.ok) return data;
      return this.writeData({
        ...data.value,
        [domain]: { ...(data.value[domain] ?? {}), [key]: value },
      });
    });
  }

  private mutate(operation: () => Promise<Result<void>>): Promise<Result<void>> {
    const mutation = this.mutations.then(operation);
    this.mutations = mutation.then(
      () => undefined,
      () => undefined,
    );
    return mutation;
  }

  private async readData(): Promise<Result<StorageData>> {
    try {
      const parsed: unknown = JSON.parse(await readFile(this.filePath, 'utf8'));
      if (!isJsonValue(parsed) || Array.isArray(parsed) || parsed === null)
        return failure('The preference storage file is invalid.');
      return ok(parsed as StorageData);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return ok({});
      return failure('The preference storage file could not be read.');
    }
  }

  private async writeData(data: StorageData): Promise<Result<void>> {
    const temporaryPath = `${this.filePath}.tmp`;
    try {
      await mkdir(dirname(this.filePath), { recursive: true });
      await writeFile(temporaryPath, JSON.stringify(data, null, 2), 'utf8');
      await rename(temporaryPath, this.filePath);
      return ok(undefined);
    } catch {
      return failure('The preference storage file could not be written.');
    }
  }
}
