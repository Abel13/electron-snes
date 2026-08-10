import { err, ok } from '@platform/core';
import type { Result } from '@platform/core';

import {
  NORMALIZED_INPUT_ACTIONS,
  isNormalizedInputAction,
  type NormalizedInputAction,
} from './actions.js';

const IDENTIFIER_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

export interface ConsoleInputMappingEntry {
  readonly consoleAction: string;
  readonly normalizedAction: NormalizedInputAction;
}

export interface ConsoleInputMapping {
  readonly consoleId: string;
  readonly entries: readonly ConsoleInputMappingEntry[];
  readonly playerPortId: string;
  readonly version: 1;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const validateConsoleInputMapping = (
  input: unknown,
  allowedConsoleActions?: readonly string[],
): Result<ConsoleInputMapping> => {
  if (!isRecord(input) || input['version'] !== 1 || !Array.isArray(input['entries']))
    return err({
      code: 'invalid-input',
      message: 'A version 1 console input mapping is required.',
    });
  if (
    typeof input['consoleId'] !== 'string' ||
    typeof input['playerPortId'] !== 'string' ||
    !IDENTIFIER_PATTERN.test(input['playerPortId'])
  )
    return err({ code: 'invalid-input', message: 'The console and player port are invalid.' });

  const entries: ConsoleInputMappingEntry[] = [];
  for (const candidate of input['entries']) {
    if (
      !isRecord(candidate) ||
      !isNormalizedInputAction(candidate['normalizedAction']) ||
      typeof candidate['consoleAction'] !== 'string' ||
      !IDENTIFIER_PATTERN.test(candidate['consoleAction']) ||
      (allowedConsoleActions !== undefined &&
        !allowedConsoleActions.includes(candidate['consoleAction']))
    )
      return err({
        code: 'invalid-input',
        message: 'The console input mapping contains an invalid entry.',
      });
    entries.push({
      consoleAction: candidate['consoleAction'],
      normalizedAction: candidate['normalizedAction'],
    });
  }

  const normalized = entries.map((entry) => entry.normalizedAction);
  const consoleActions = entries.map((entry) => entry.consoleAction);
  if (
    entries.length !== NORMALIZED_INPUT_ACTIONS.length ||
    new Set(normalized).size !== entries.length ||
    new Set(consoleActions).size !== entries.length
  )
    return err({
      code: 'invalid-input',
      message: 'Every normalized and console action must appear exactly once.',
    });
  return ok({
    consoleId: input['consoleId'],
    entries,
    playerPortId: input['playerPortId'],
    version: 1,
  });
};

export const mapNormalizedActions = (
  actions: readonly NormalizedInputAction[],
  mapping: ConsoleInputMapping,
): readonly string[] => {
  const active = new Set(actions);
  return mapping.entries
    .filter((entry) => active.has(entry.normalizedAction))
    .map((entry) => entry.consoleAction)
    .sort();
};
