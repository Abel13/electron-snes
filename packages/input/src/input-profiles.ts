import { err, ok } from '@platform/core';
import type { JsonStoragePort, Result } from '@platform/core';
import type { JsonValue } from '@platform/shared';

import type { ConsoleInputMapping } from './console-mapping.js';
import { validateConsoleInputMapping } from './console-mapping.js';

const PROFILE_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export interface InputProfile {
  readonly deviceFingerprint: string;
  readonly id: string;
  readonly mapping: ConsoleInputMapping;
  readonly name: string;
  readonly version: 1;
}

export const validateInputProfile = (input: unknown): Result<InputProfile> => {
  if (typeof input !== 'object' || input === null || Array.isArray(input))
    return err({ code: 'invalid-input', message: 'An input profile object is required.' });
  const candidate = input as Record<string, unknown>;
  if (
    candidate['version'] !== 1 ||
    typeof candidate['id'] !== 'string' ||
    !PROFILE_ID_PATTERN.test(candidate['id']) ||
    typeof candidate['name'] !== 'string' ||
    candidate['name'].trim().length === 0 ||
    typeof candidate['deviceFingerprint'] !== 'string' ||
    candidate['deviceFingerprint'].length === 0
  )
    return err({ code: 'invalid-input', message: 'The input profile metadata is invalid.' });
  const mapping = validateConsoleInputMapping(candidate['mapping']);
  if (!mapping.ok) return mapping;
  return ok({
    deviceFingerprint: candidate['deviceFingerprint'],
    id: candidate['id'],
    mapping: mapping.value,
    name: candidate['name'].trim(),
    version: 1,
  });
};

const toJson = (profile: InputProfile): JsonValue => ({
  deviceFingerprint: profile.deviceFingerprint,
  id: profile.id,
  mapping: {
    consoleId: profile.mapping.consoleId,
    entries: profile.mapping.entries.map((entry) => ({ ...entry })),
    playerPortId: profile.mapping.playerPortId,
    version: profile.mapping.version,
  },
  name: profile.name,
  version: profile.version,
});

export class InputProfileRepository {
  public constructor(private readonly storage: JsonStoragePort) {}

  public async load(id: string): Promise<Result<InputProfile | undefined>> {
    const result = await this.storage.read('user-preferences', `input-profile:${id}`);
    if (!result.ok) return result;
    if (result.value === undefined) return ok(undefined);
    const profile = validateInputProfile(result.value);
    return profile.ok ? ok(profile.value) : profile;
  }

  public async save(profile: InputProfile): Promise<Result<void>> {
    const validated = validateInputProfile(profile);
    if (!validated.ok) return validated;
    return this.storage.write(
      'user-preferences',
      `input-profile:${validated.value.id}`,
      toJson(validated.value),
    );
  }
}
