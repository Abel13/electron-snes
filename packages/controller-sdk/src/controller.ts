import { PluginManifestSchema } from '@platform/plugin-sdk';
import type { PluginManifest } from '@platform/plugin-sdk';

const IDENTIFIER_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const HEX_ID_PATTERN = /^[0-9a-f]{4}$/;
const MAX_BUTTON_INDEX = 63;
const MAX_AXIS_INDEX = 15;

export interface ControllerDeviceMatch {
  readonly nameIncludes?: readonly string[];
  readonly productId?: string;
  readonly standardMapping?: boolean;
  readonly vendorId?: string;
}

export interface ControllerButtonInput {
  readonly index: number;
  readonly kind: 'button';
}

export interface ControllerAxisInput {
  readonly direction: 'negative' | 'positive';
  readonly index: number;
  readonly kind: 'axis';
  readonly threshold?: number;
}

export type ControllerPhysicalInput = ControllerAxisInput | ControllerButtonInput;

export interface ControllerMappingEntry {
  readonly input: ControllerPhysicalInput;
  readonly normalizedAction: string;
}

export interface ControllerDefinition {
  readonly id: string;
  readonly mappings: readonly ControllerMappingEntry[];
  readonly match: readonly ControllerDeviceMatch[];
}

export interface ControllerPluginDefinition {
  readonly controller: ControllerDefinition;
  readonly manifest: PluginManifest;
}

export interface ControllerPluginDiagnostic {
  readonly code:
    | 'controller-definition-invalid'
    | 'controller-manifest-invalid'
    | 'controller-manifest-type-invalid';
  readonly message: string;
  readonly path: readonly (number | string)[];
}

export interface ValidControllerPluginDefinition {
  readonly definition: ControllerPluginDefinition;
  readonly status: 'valid';
}

export interface InvalidControllerPluginDefinition {
  readonly diagnostics: readonly ControllerPluginDiagnostic[];
  readonly status: 'invalid';
}

export type ControllerPluginValidationResult =
  | InvalidControllerPluginDefinition
  | ValidControllerPluginDefinition;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isIdentifier = (value: unknown): value is string =>
  typeof value === 'string' && IDENTIFIER_PATTERN.test(value);

const diagnostic = (
  path: readonly (number | string)[],
  message: string,
  code: ControllerPluginDiagnostic['code'] = 'controller-definition-invalid',
): ControllerPluginDiagnostic => ({ code, message, path });

const isDeviceMatch = (value: unknown): value is ControllerDeviceMatch => {
  if (!isRecord(value)) return false;

  const knownKeys = new Set(['nameIncludes', 'productId', 'standardMapping', 'vendorId']);
  if (Object.keys(value).some((key) => !knownKeys.has(key))) return false;

  const nameIncludes = value['nameIncludes'];
  const productId = value['productId'];
  const standardMapping = value['standardMapping'];
  const vendorId = value['vendorId'];
  const hasCriterion =
    nameIncludes !== undefined ||
    productId !== undefined ||
    standardMapping !== undefined ||
    vendorId !== undefined;

  return (
    hasCriterion &&
    (nameIncludes === undefined ||
      (Array.isArray(nameIncludes) &&
        nameIncludes.length > 0 &&
        nameIncludes.every((part) => typeof part === 'string' && part.trim().length > 0))) &&
    (productId === undefined || (typeof productId === 'string' && HEX_ID_PATTERN.test(productId))) &&
    (vendorId === undefined || (typeof vendorId === 'string' && HEX_ID_PATTERN.test(vendorId))) &&
    (standardMapping === undefined || typeof standardMapping === 'boolean')
  );
};

const parsePhysicalInput = (value: unknown): ControllerPhysicalInput | undefined => {
  if (!isRecord(value)) return undefined;

  if (value['kind'] === 'button') {
    const index = value['index'];
    if (
      Object.keys(value).every((key) => key === 'index' || key === 'kind') &&
      Number.isInteger(index) &&
      typeof index === 'number' &&
      index >= 0 &&
      index <= MAX_BUTTON_INDEX
    )
      return { index, kind: 'button' };
  }

  if (value['kind'] === 'axis') {
    const direction = value['direction'];
    const index = value['index'];
    const threshold = value['threshold'];
    if (
      Object.keys(value).every((key) =>
        key === 'direction' || key === 'index' || key === 'kind' || key === 'threshold'
      ) &&
      (direction === 'negative' || direction === 'positive') &&
      Number.isInteger(index) &&
      typeof index === 'number' &&
      index >= 0 &&
      index <= MAX_AXIS_INDEX &&
      (threshold === undefined ||
        (typeof threshold === 'number' && Number.isFinite(threshold) && threshold >= 0.1 && threshold <= 1))
    )
      return threshold === undefined
        ? { direction, index, kind: 'axis' }
        : { direction, index, kind: 'axis', threshold };
  }

  return undefined;
};

const physicalInputKey = (input: ControllerPhysicalInput): string =>
  input.kind === 'button'
    ? `button:${input.index}`
    : `axis:${input.index}:${input.direction}`;

export const defineController = <TDefinition extends ControllerPluginDefinition>(
  definition: TDefinition,
): TDefinition => definition;

export const validateControllerPlugin = (input: unknown): ControllerPluginValidationResult => {
  if (!isRecord(input))
    return {
      diagnostics: [diagnostic([], 'A controller plugin definition must be an object.')],
      status: 'invalid',
    };

  const manifestResult = PluginManifestSchema.safeParse(input['manifest']);
  if (!manifestResult.success)
    return {
      diagnostics: manifestResult.error.issues.map((issue) =>
        diagnostic(
          ['manifest', ...issue.path.filter((part): part is number | string =>
            typeof part === 'number' || typeof part === 'string')],
          issue.message,
          'controller-manifest-invalid',
        ),
      ),
      status: 'invalid',
    };

  if (manifestResult.data.type !== 'controller')
    return {
      diagnostics: [
        diagnostic(
          ['manifest', 'type'],
          'A controller plugin definition must use a controller manifest.',
          'controller-manifest-type-invalid',
        ),
      ],
      status: 'invalid',
    };

  const controller = input['controller'];
  if (!isRecord(controller))
    return {
      diagnostics: [diagnostic(['controller'], 'A controller definition must be an object.')],
      status: 'invalid',
    };

  const diagnostics: ControllerPluginDiagnostic[] = [];
  const id = controller['id'];
  const match = controller['match'];
  const mappings = controller['mappings'];

  if (!isIdentifier(id) || id !== manifestResult.data.id)
    diagnostics.push(
      diagnostic(['controller', 'id'], 'The controller identifier must match the plugin manifest identifier.'),
    );

  if (!Array.isArray(match) || match.length === 0 || !match.every(isDeviceMatch))
    diagnostics.push(
      diagnostic(['controller', 'match'], 'Controller matching must contain valid declarative criteria.'),
    );

  if (!Array.isArray(mappings) || mappings.length === 0) {
    diagnostics.push(
      diagnostic(['controller', 'mappings'], 'A controller must declare at least one input mapping.'),
    );
  } else {
    const physicalInputs: string[] = [];
    const normalizedActions: string[] = [];

    mappings.forEach((mapping, index) => {
      if (!isRecord(mapping) || !isIdentifier(mapping['normalizedAction'])) {
        diagnostics.push(
          diagnostic(
            ['controller', 'mappings', index],
            'A mapping must declare a kebab-case normalized action.',
          ),
        );
        return;
      }

      const physicalInput = parsePhysicalInput(mapping['input']);
      if (physicalInput === undefined) {
        diagnostics.push(
          diagnostic(
            ['controller', 'mappings', index, 'input'],
            'A mapping input must be a supported button or directional axis.',
          ),
        );
        return;
      }

      physicalInputs.push(physicalInputKey(physicalInput));
      normalizedActions.push(mapping['normalizedAction']);
    });

    if (new Set(physicalInputs).size !== physicalInputs.length)
      diagnostics.push(
        diagnostic(['controller', 'mappings'], 'Physical controller inputs must be unique.'),
      );
    if (new Set(normalizedActions).size !== normalizedActions.length)
      diagnostics.push(
        diagnostic(['controller', 'mappings'], 'Normalized controller actions must be unique.'),
      );
  }

  if (diagnostics.length > 0) return { diagnostics, status: 'invalid' };

  return {
    definition: input as unknown as ControllerPluginDefinition,
    status: 'valid',
  };
};
