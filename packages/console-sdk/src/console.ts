import { PluginManifestSchema } from '@platform/plugin-sdk';
import type { PluginManifest } from '@platform/plugin-sdk';

const IDENTIFIER_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const ROM_EXTENSION_PATTERN = /^\.[a-z0-9]+$/;
const ASSET_PATH_PATTERN = /^assets\/[a-z0-9][a-z0-9/_-]*\.(?:png|webp|svg)$/;
const GENERATION_KEY_PATTERN = /^[a-z][a-zA-Z0-9]*$/;

export type ConsoleInputActionId = string;

export interface ConsoleInputAction {
  readonly id: ConsoleInputActionId;
}

export interface ConsolePlayerPort {
  readonly id: string;
  readonly inputActions: readonly ConsoleInputActionId[];
}

export interface ConsoleInputMappingEntry {
  readonly consoleAction: ConsoleInputActionId;
  readonly normalizedAction: string;
}

export interface ConsoleInputMapping {
  readonly entries: readonly ConsoleInputMappingEntry[];
  readonly playerPortId: string;
  readonly version: 1;
}

export interface ConsoleVideoPresentation {
  readonly nativeResolution: { readonly width: number; readonly height: number };
  readonly scalingModes: readonly ('pixel-perfect' | 'fit' | 'fill')[];
  readonly defaultScalingMode: 'pixel-perfect' | 'fit' | 'fill';
  readonly allowCrop: boolean;
  readonly filtering: 'nearest' | 'linear';
  readonly scene: {
    readonly layout: 'portable-vertical' | 'portable-wide' | 'home-4-3' | 'custom';
    readonly frameStyle: string;
    readonly backdropStyle: string;
    readonly accent: string;
  };
}

export interface ConsoleAssetProfile {
  readonly consoleHero: string;
  readonly cartridge?: string;
  readonly blueprint?: string;
  readonly sessionBackdrop?: string;
  readonly cartridgeLabelMask?: string;
  readonly controlDiagram?: {
    readonly alt: string;
    readonly controlPoints: readonly {
      readonly action: string;
      readonly x: number;
      readonly y: number;
    }[];
  };
}

export interface ConsoleGameIdentifier {
  readonly namespace: string;
  readonly value: string;
}

export interface ConsoleDefinition {
  readonly assets?: ConsoleAssetProfile;
  readonly generationKey?: string;
  readonly maxRomBytes: number;
  readonly capabilities: readonly string[];
  readonly id: string;
  readonly identifyRom?: (bytes: Uint8Array) => readonly ConsoleGameIdentifier[];
  readonly inputActions: readonly ConsoleInputAction[];
  readonly inputMapping: ConsoleInputMapping;
  readonly playerPorts: readonly ConsolePlayerPort[];
  readonly supportedRomExtensions: readonly string[];
  readonly videoPresentation?: ConsoleVideoPresentation;
}

export interface ConsolePluginDefinition {
  readonly console: ConsoleDefinition;
  readonly manifest: PluginManifest;
}

export interface ConsolePluginDiagnostic {
  readonly code:
    'console-definition-invalid' | 'console-manifest-invalid' | 'console-manifest-type-invalid';
  readonly message: string;
  readonly path: readonly (number | string)[];
}

export interface ValidConsolePluginDefinition {
  readonly definition: ConsolePluginDefinition;
  readonly status: 'valid';
}

export interface InvalidConsolePluginDefinition {
  readonly diagnostics: readonly ConsolePluginDiagnostic[];
  readonly status: 'invalid';
}

export type ConsolePluginValidationResult =
  InvalidConsolePluginDefinition | ValidConsolePluginDefinition;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const hasUniqueValues = (values: readonly string[]): boolean =>
  new Set(values).size === values.length;

const isIdentifier = (value: unknown): value is string =>
  typeof value === 'string' && IDENTIFIER_PATTERN.test(value);

const isRomExtension = (value: unknown): value is string =>
  typeof value === 'string' && ROM_EXTENSION_PATTERN.test(value);

const diagnostic = (
  path: readonly (number | string)[],
  message: string,
  code: ConsolePluginDiagnostic['code'] = 'console-definition-invalid',
): ConsolePluginDiagnostic => ({ code, message, path });

export const defineConsole = <TDefinition extends ConsolePluginDefinition>(
  definition: TDefinition,
): TDefinition => definition;

export const validateConsolePlugin = (input: unknown): ConsolePluginValidationResult => {
  if (!isRecord(input)) {
    return {
      diagnostics: [diagnostic([], 'A console plugin definition must be an object.')],
      status: 'invalid',
    };
  }

  const manifestResult = PluginManifestSchema.safeParse(input['manifest']);

  if (!manifestResult.success) {
    return {
      diagnostics: manifestResult.error.issues.map((issue) =>
        diagnostic(
          [
            'manifest',
            ...issue.path.filter(
              (segment): segment is number | string =>
                typeof segment === 'number' || typeof segment === 'string',
            ),
          ],
          issue.message,
          'console-manifest-invalid',
        ),
      ),
      status: 'invalid',
    };
  }

  if (manifestResult.data.type !== 'console') {
    return {
      diagnostics: [
        diagnostic(
          ['manifest', 'type'],
          'A console plugin definition must use a console manifest.',
          'console-manifest-type-invalid',
        ),
      ],
      status: 'invalid',
    };
  }

  const definition = input['console'];

  if (!isRecord(definition)) {
    return {
      diagnostics: [diagnostic(['console'], 'A console definition must be an object.')],
      status: 'invalid',
    };
  }

  const capabilities = definition['capabilities'];
  const id = definition['id'];
  const inputActions = definition['inputActions'];
  const identifyRom = definition['identifyRom'];
  const inputMapping = definition['inputMapping'];
  const playerPorts = definition['playerPorts'];
  const supportedRomExtensions = definition['supportedRomExtensions'];
  const assets = definition['assets'];
  const generationKey = definition['generationKey'];
  const maxRomBytes = definition['maxRomBytes'];
  const diagnostics: ConsolePluginDiagnostic[] = [];

  if (
    typeof maxRomBytes !== 'number' ||
    !Number.isSafeInteger(maxRomBytes) ||
    maxRomBytes <= 0 ||
    maxRomBytes > 64 * 1024 * 1024
  )
    diagnostics.push(
      diagnostic(
        ['console', 'maxRomBytes'],
        'A console must declare a positive ROM limit up to 64 MiB.',
      ),
    );

  if (
    generationKey !== undefined &&
    (typeof generationKey !== 'string' || !GENERATION_KEY_PATTERN.test(generationKey))
  )
    diagnostics.push(
      diagnostic(['console', 'generationKey'], 'Generation keys must be kebab-case identifiers.'),
    );

  if (assets !== undefined) {
    if (!isRecord(assets)) {
      diagnostics.push(diagnostic(['console', 'assets'], 'Console assets must be an object.'));
    } else {
      const assetKeys = [
        'consoleHero',
        'cartridge',
        'blueprint',
        'sessionBackdrop',
        'cartridgeLabelMask',
      ] as const;
      for (const key of assetKeys) {
        const value = assets[key];
        if (key === 'consoleHero' && typeof value !== 'string') {
          diagnostics.push(
            diagnostic(['console', 'assets', key], 'A console hero asset is required.'),
          );
        } else if (
          value !== undefined &&
          (typeof value !== 'string' || !ASSET_PATH_PATTERN.test(value))
        ) {
          diagnostics.push(
            diagnostic(
              ['console', 'assets', key],
              'Asset references must be normalized paths under assets/ using png, webp or svg.',
            ),
          );
        }
      }
      const diagram = assets['controlDiagram'];
      if (diagram !== undefined) {
        if (
          !isRecord(diagram) ||
          typeof diagram['alt'] !== 'string' ||
          !Array.isArray(diagram['controlPoints'])
        ) {
          diagnostics.push(
            diagnostic(
              ['console', 'assets', 'controlDiagram'],
              'A control diagram must declare alt text and control points.',
            ),
          );
        } else {
          diagram['controlPoints'].forEach((point, index) => {
            if (
              !isRecord(point) ||
              !isIdentifier(point['action']) ||
              typeof point['x'] !== 'number' ||
              typeof point['y'] !== 'number' ||
              point['x'] < 0 ||
              point['x'] > 100 ||
              point['y'] < 0 ||
              point['y'] > 100
            )
              diagnostics.push(
                diagnostic(
                  ['console', 'assets', 'controlDiagram', 'controlPoints', index],
                  'Control points require an action and normalized coordinates between 0 and 100.',
                ),
              );
          });
        }
      }
    }
  }

  if (identifyRom !== undefined && typeof identifyRom !== 'function')
    diagnostics.push(
      diagnostic(['console', 'identifyRom'], 'A ROM identifier extractor must be a function.'),
    );

  if (typeof id !== 'string') {
    diagnostics.push(diagnostic(['console', 'id'], 'A console identifier must be a string.'));
  } else if (id !== manifestResult.data.id) {
    diagnostics.push(
      diagnostic(
        ['console', 'id'],
        'The console identifier must match the plugin manifest identifier.',
      ),
    );
  }

  if (
    !Array.isArray(capabilities) ||
    capabilities.length === 0 ||
    !capabilities.every(isIdentifier)
  ) {
    diagnostics.push(
      diagnostic(
        ['console', 'capabilities'],
        'Console capabilities must be a non-empty kebab-case list.',
      ),
    );
  } else if (!hasUniqueValues(capabilities)) {
    diagnostics.push(
      diagnostic(['console', 'capabilities'], 'Console capabilities must be unique.'),
    );
  }

  if (
    !Array.isArray(supportedRomExtensions) ||
    supportedRomExtensions.length === 0 ||
    !supportedRomExtensions.every(isRomExtension)
  ) {
    diagnostics.push(
      diagnostic(
        ['console', 'supportedRomExtensions'],
        'Supported ROM extensions must be a non-empty lowercase extension list.',
      ),
    );
  } else if (!hasUniqueValues(supportedRomExtensions)) {
    diagnostics.push(
      diagnostic(['console', 'supportedRomExtensions'], 'Supported ROM extensions must be unique.'),
    );
  }

  const actionIds = Array.isArray(inputActions)
    ? inputActions.map((action) => (isRecord(action) ? action['id'] : undefined))
    : [];

  if (!Array.isArray(inputActions) || inputActions.length === 0 || !actionIds.every(isIdentifier)) {
    diagnostics.push(
      diagnostic(
        ['console', 'inputActions'],
        'Console input actions must be a non-empty kebab-case list.',
      ),
    );
  } else if (!hasUniqueValues(actionIds)) {
    diagnostics.push(
      diagnostic(['console', 'inputActions'], 'Console input actions must be unique.'),
    );
  }

  if (!Array.isArray(playerPorts) || playerPorts.length === 0) {
    diagnostics.push(
      diagnostic(['console', 'playerPorts'], 'A console must declare at least one player port.'),
    );
  } else {
    const availableActions = new Set(actionIds.filter(isIdentifier));
    const portIds: string[] = [];

    playerPorts.forEach((port, index) => {
      if (!isRecord(port) || !isIdentifier(port['id'])) {
        diagnostics.push(
          diagnostic(
            ['console', 'playerPorts', index, 'id'],
            'A player port identifier must be lowercase kebab-case.',
          ),
        );
        return;
      }

      portIds.push(port['id']);
      const portActions = port['inputActions'];

      if (
        !Array.isArray(portActions) ||
        portActions.length === 0 ||
        !portActions.every(isIdentifier)
      ) {
        diagnostics.push(
          diagnostic(
            ['console', 'playerPorts', index, 'inputActions'],
            'A player port must expose declared input actions.',
          ),
        );
      } else if (
        !hasUniqueValues(portActions) ||
        portActions.some((action) => !availableActions.has(action))
      ) {
        diagnostics.push(
          diagnostic(
            ['console', 'playerPorts', index, 'inputActions'],
            'A player port may reference each declared console input action at most once.',
          ),
        );
      }
    });

    if (!hasUniqueValues(portIds)) {
      diagnostics.push(
        diagnostic(['console', 'playerPorts'], 'Player port identifiers must be unique.'),
      );
    }
  }

  if (
    !isRecord(inputMapping) ||
    inputMapping['version'] !== 1 ||
    !Array.isArray(inputMapping['entries'])
  ) {
    diagnostics.push(
      diagnostic(['console', 'inputMapping'], 'A version 1 input mapping is required.'),
    );
  } else {
    const entries = inputMapping['entries'];
    const normalizedActions: string[] = [];
    const consoleActions: string[] = [];
    for (const [index, entry] of entries.entries()) {
      if (
        !isRecord(entry) ||
        !isIdentifier(entry['normalizedAction']) ||
        !isIdentifier(entry['consoleAction'])
      ) {
        diagnostics.push(
          diagnostic(
            ['console', 'inputMapping', 'entries', index],
            'Input mapping entries must contain kebab-case action identifiers.',
          ),
        );
        continue;
      }
      normalizedActions.push(entry['normalizedAction']);
      consoleActions.push(entry['consoleAction']);
    }
    if (
      !isIdentifier(inputMapping['playerPortId']) ||
      entries.length === 0 ||
      !hasUniqueValues(normalizedActions) ||
      !hasUniqueValues(consoleActions) ||
      consoleActions.some((action) => !actionIds.includes(action))
    )
      diagnostics.push(
        diagnostic(
          ['console', 'inputMapping'],
          'The input mapping must reference unique declared console actions.',
        ),
      );
  }

  if (diagnostics.length > 0) {
    return { diagnostics, status: 'invalid' };
  }

  return {
    definition: input as unknown as ConsolePluginDefinition,
    status: 'valid',
  };
};
