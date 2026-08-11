import { validateConsolePlugin } from '@platform/console-sdk';
import { validateControllerPlugin } from '@platform/controller-sdk';
import { validateEmulatorPlugin } from '@platform/emulator-sdk';
import { validateGameMetadataPlugin } from '@platform/game-sdk';
import { validatePluginManifest } from '@platform/plugin-sdk';
import type {
  PluginApiCompatibility,
  PluginApiSupportRange,
  PluginManifest,
  PluginManifestDiagnostic,
  PluginType,
} from '@platform/plugin-sdk';

export type PluginContractDiagnosticCode =
  | PluginManifestDiagnostic['code']
  | 'plugin-contract-invalid'
  | 'plugin-contract-validator-unavailable';

export interface PluginContractDiagnostic {
  readonly code: PluginContractDiagnosticCode;
  readonly message: string;
  readonly path: readonly (number | string)[];
}

export interface PluginContractValidationOptions {
  readonly supportedApiRange?: PluginApiSupportRange;
}

export interface ValidPluginContract {
  readonly manifest: PluginManifest;
  readonly status: 'valid';
  readonly type: PluginType;
}

export interface InactivePluginContract {
  readonly compatibility: PluginApiCompatibility;
  readonly diagnostic: PluginContractDiagnostic;
  readonly manifest: PluginManifest;
  readonly status: 'inactive';
  readonly type: PluginType;
}

export interface InvalidPluginContract {
  readonly diagnostics: readonly PluginContractDiagnostic[];
  readonly status: 'invalid';
}

export type PluginContractResult =
  | InactivePluginContract
  | InvalidPluginContract
  | ValidPluginContract;

type SpecializedValidation =
  | { readonly valid: true }
  | { readonly diagnostics: readonly PluginContractDiagnostic[]; readonly valid: false };

const normalizeDiagnostics = (
  diagnostics: readonly { readonly message: string; readonly path: readonly (number | string)[] }[],
): SpecializedValidation => ({
  diagnostics: diagnostics.map(({ message, path }) => ({
    code: 'plugin-contract-invalid',
    message,
    path,
  })),
  valid: false,
});

const validateSpecializedContract = (type: PluginType, input: unknown): SpecializedValidation => {
  if (type === 'console') {
    const result = validateConsolePlugin(input);
    return result.status === 'valid' ? { valid: true } : normalizeDiagnostics(result.diagnostics);
  }
  if (type === 'controller') {
    const result = validateControllerPlugin(input);
    return result.status === 'valid' ? { valid: true } : normalizeDiagnostics(result.diagnostics);
  }
  if (type === 'game-metadata') {
    const result = validateGameMetadataPlugin(input);
    return result.status === 'valid' ? { valid: true } : normalizeDiagnostics(result.diagnostics);
  }
  if (type === 'emulator-core') {
    const result = validateEmulatorPlugin(input);
    return result.status === 'ok'
      ? { valid: true }
      : {
          diagnostics: [{ code: 'plugin-contract-invalid', message: result.message, path: ['emulator'] }],
          valid: false,
        };
  }
  return {
    diagnostics: [{
      code: 'plugin-contract-validator-unavailable',
      message: `No public definition validator is available for plugin type ${type}.`,
      path: ['manifest', 'type'],
    }],
    valid: false,
  };
};

export const validatePluginContract = (
  input: unknown,
  options: PluginContractValidationOptions = {},
): PluginContractResult => {
  const manifest =
    typeof input === 'object' && input !== null && !Array.isArray(input)
      ? (input as Record<string, unknown>)['manifest']
      : undefined;
  const manifestResult = validatePluginManifest(
    manifest,
    options.supportedApiRange === undefined
      ? undefined
      : { supportedApiRange: options.supportedApiRange },
  );

  if (manifestResult.status === 'invalid')
    return { diagnostics: manifestResult.diagnostics, status: 'invalid' };
  if (manifestResult.status === 'inactive')
    return {
      compatibility: manifestResult.compatibility,
      diagnostic: manifestResult.diagnostic,
      manifest: manifestResult.manifest,
      status: 'inactive',
      type: manifestResult.manifest.type,
    };

  const specializedResult = validateSpecializedContract(manifestResult.manifest.type, input);
  if (!specializedResult.valid)
    return { diagnostics: specializedResult.diagnostics, status: 'invalid' };

  return { manifest: manifestResult.manifest, status: 'valid', type: manifestResult.manifest.type };
};
