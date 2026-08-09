import { assessPluginApiCompatibility, DEFAULT_PLUGIN_API_SUPPORT_RANGE } from './api-version.js';
import type {
  CompatiblePluginApi,
  PluginApiSupportRange,
  UnsupportedPluginApi,
} from './api-version.js';
import { PluginManifestSchema } from './manifest.js';
import type { PluginManifest } from './manifest.js';

type DiagnosticPathSegment = number | string;

interface SchemaIssue {
  readonly message: string;
  readonly path: readonly PropertyKey[];
}

export type PluginManifestDiagnosticCode =
  'manifest-schema-invalid' | 'unsupported-plugin-api-version';

export interface PluginManifestDiagnostic {
  readonly code: PluginManifestDiagnosticCode;
  readonly message: string;
  readonly path: readonly DiagnosticPathSegment[];
}

export interface PluginManifestValidationOptions {
  readonly supportedApiRange?: PluginApiSupportRange;
}

export interface ValidPluginManifest {
  readonly compatibility: CompatiblePluginApi;
  readonly manifest: PluginManifest;
  readonly status: 'valid';
}

export interface InactivePluginManifest {
  readonly compatibility: UnsupportedPluginApi;
  readonly diagnostic: PluginManifestDiagnostic;
  readonly manifest: PluginManifest;
  readonly status: 'inactive';
}

export interface InvalidPluginManifest {
  readonly diagnostics: readonly PluginManifestDiagnostic[];
  readonly status: 'invalid';
}

export type PluginManifestValidationResult =
  InactivePluginManifest | InvalidPluginManifest | ValidPluginManifest;

const toDiagnosticPath = (path: readonly PropertyKey[]): readonly DiagnosticPathSegment[] =>
  path.filter(
    (segment): segment is DiagnosticPathSegment =>
      typeof segment === 'number' || typeof segment === 'string',
  );

const toSchemaDiagnostic = (issue: SchemaIssue): PluginManifestDiagnostic => ({
  code: 'manifest-schema-invalid',
  message: issue.message,
  path: toDiagnosticPath(issue.path),
});

export const validatePluginManifest = (
  input: unknown,
  options: PluginManifestValidationOptions = {},
): PluginManifestValidationResult => {
  const parsedManifest = PluginManifestSchema.safeParse(input);

  if (!parsedManifest.success) {
    return {
      diagnostics: parsedManifest.error.issues.map(toSchemaDiagnostic),
      status: 'invalid',
    };
  }

  const compatibility = assessPluginApiCompatibility(
    parsedManifest.data.apiVersion,
    options.supportedApiRange ?? DEFAULT_PLUGIN_API_SUPPORT_RANGE,
  );

  if (compatibility.status === 'unsupported') {
    return {
      compatibility,
      diagnostic: {
        code: 'unsupported-plugin-api-version',
        message: 'The declared plugin API version is not supported by the host.',
        path: ['apiVersion'],
      },
      manifest: parsedManifest.data,
      status: 'inactive',
    };
  }

  return {
    compatibility,
    manifest: parsedManifest.data,
    status: 'valid',
  };
};
