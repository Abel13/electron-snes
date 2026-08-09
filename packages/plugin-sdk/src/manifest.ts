import { PERMISSION_ACTIONS } from '@platform/core';
import { z } from 'zod';

const CAPABILITY_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const PLUGIN_ID_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/;
const PERMISSION_RESOURCE_PATTERN = /^[a-z][a-z0-9-]*(?::[a-z][a-z0-9-]*)*$/;
const SEMVER_PATTERN =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

const MAX_CAPABILITIES = 64;
const MAX_CAPABILITY_LENGTH = 64;
const MAX_PERMISSION_REASON_LENGTH = 240;
const MAX_PERMISSION_RESOURCE_LENGTH = 120;
const MAX_PERMISSIONS = 32;
const MAX_PLUGIN_ID_LENGTH = 128;
const MAX_PLUGIN_NAME_LENGTH = 120;
const MAX_PLUGIN_VERSION_LENGTH = 64;

export const PLUGIN_TYPES = [
  'console',
  'emulator-core',
  'controller',
  'game-metadata',
  'theme',
  'integration',
] as const;

export type PluginType = (typeof PLUGIN_TYPES)[number];

const hasUniqueValues = <TValue>(values: readonly TValue[]): boolean =>
  new Set(values).size === values.length;

export const PluginManifestPermissionSchema = z.strictObject({
  actions: z
    .array(z.enum(PERMISSION_ACTIONS))
    .min(1)
    .max(PERMISSION_ACTIONS.length)
    .refine(hasUniqueValues),
  reason: z.string().trim().min(1).max(MAX_PERMISSION_REASON_LENGTH).optional(),
  resource: z.string().max(MAX_PERMISSION_RESOURCE_LENGTH).regex(PERMISSION_RESOURCE_PATTERN),
});

export type PluginManifestPermission = z.infer<typeof PluginManifestPermissionSchema>;

export const PluginManifestSchema = z
  .strictObject({
    apiVersion: z.number().int().positive(),
    capabilities: z
      .array(z.string().max(MAX_CAPABILITY_LENGTH).regex(CAPABILITY_PATTERN))
      .min(1)
      .max(MAX_CAPABILITIES)
      .refine(hasUniqueValues),
    id: z.string().max(MAX_PLUGIN_ID_LENGTH).regex(PLUGIN_ID_PATTERN),
    name: z.string().trim().min(1).max(MAX_PLUGIN_NAME_LENGTH),
    permissions: z
      .array(PluginManifestPermissionSchema)
      .max(MAX_PERMISSIONS)
      .superRefine((permissions, context) => {
        const resources = permissions.map((permission) => permission.resource);

        if (!hasUniqueValues(resources)) {
          context.addIssue({
            code: 'custom',
            message: 'Each permission resource may appear only once.',
          });
        }
      }),
    type: z.enum(PLUGIN_TYPES),
    version: z.string().max(MAX_PLUGIN_VERSION_LENGTH).regex(SEMVER_PATTERN),
  })
  .readonly();

export type PluginManifest = z.infer<typeof PluginManifestSchema>;
