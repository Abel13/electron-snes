import { InMemoryRegistry } from '@platform/core';
import type { RegistryEntry, Result } from '@platform/core';

import type { CompatiblePluginApi, UnsupportedPluginApi } from './api-version.js';
import type { PluginManifest } from './manifest.js';
import type {
  InactivePluginManifest,
  PluginManifestDiagnostic,
  ValidPluginManifest,
} from './validate-manifest.js';

export interface EligiblePlugin {
  readonly compatibility: CompatiblePluginApi;
  readonly manifest: PluginManifest;
  readonly status: 'eligible';
}

export interface InactivePlugin {
  readonly compatibility: UnsupportedPluginApi;
  readonly diagnostic: PluginManifestDiagnostic;
  readonly manifest: PluginManifest;
  readonly status: 'inactive';
}

export type PluginRegistryEntry = RegistryEntry<RegisteredPlugin>;

export type PluginRegistryRecord = InactivePlugin | EligiblePlugin;

export type RegisterablePluginManifest = InactivePluginManifest | ValidPluginManifest;

export type RegisteredPlugin = InactivePlugin | EligiblePlugin;

const toRegisteredPlugin = (manifest: RegisterablePluginManifest): RegisteredPlugin => {
  if (manifest.status === 'inactive') {
    return {
      compatibility: manifest.compatibility,
      diagnostic: manifest.diagnostic,
      manifest: manifest.manifest,
      status: 'inactive',
    };
  }

  return {
    compatibility: manifest.compatibility,
    manifest: manifest.manifest,
    status: 'eligible',
  };
};

export class PluginRegistry {
  readonly #registry = new InMemoryRegistry<RegisteredPlugin>();

  list(): Promise<Result<readonly PluginRegistryEntry[]>> {
    return this.#registry.list();
  }

  register(manifest: RegisterablePluginManifest): Promise<Result<void>> {
    const plugin = toRegisteredPlugin(manifest);

    return this.#registry.register({ id: plugin.manifest.id, value: plugin });
  }

  remove(id: string): Promise<Result<void>> {
    return this.#registry.remove(id);
  }

  resolve(id: string): Promise<Result<PluginRegistryEntry>> {
    return this.#registry.resolve(id);
  }
}
