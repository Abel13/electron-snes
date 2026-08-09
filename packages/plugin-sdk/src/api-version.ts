export type PluginApiVersion = number;

export interface PluginApiSupportRange {
  readonly maxInclusive: PluginApiVersion;
  readonly minInclusive: PluginApiVersion;
}

export const CURRENT_PLUGIN_API_VERSION = 1 as const;

export const DEFAULT_PLUGIN_API_SUPPORT_RANGE: PluginApiSupportRange = {
  maxInclusive: CURRENT_PLUGIN_API_VERSION,
  minInclusive: CURRENT_PLUGIN_API_VERSION,
};

export interface CompatiblePluginApi {
  readonly activation: 'eligible';
  readonly declaredVersion: PluginApiVersion;
  readonly status: 'compatible';
  readonly supportedRange: PluginApiSupportRange;
}

export interface UnsupportedPluginApi {
  readonly activation: 'inactive';
  readonly declaredVersion: PluginApiVersion;
  readonly diagnostic: {
    readonly code: 'unsupported-plugin-api-version';
    readonly message: string;
  };
  readonly status: 'unsupported';
  readonly supportedRange: PluginApiSupportRange;
}

export type PluginApiCompatibility = CompatiblePluginApi | UnsupportedPluginApi;

export const assessPluginApiCompatibility = (
  declaredVersion: PluginApiVersion,
  supportedRange: PluginApiSupportRange = DEFAULT_PLUGIN_API_SUPPORT_RANGE,
): PluginApiCompatibility => {
  const isSupported =
    declaredVersion >= supportedRange.minInclusive &&
    declaredVersion <= supportedRange.maxInclusive;

  if (isSupported) {
    return {
      activation: 'eligible',
      declaredVersion,
      status: 'compatible',
      supportedRange,
    };
  }

  return {
    activation: 'inactive',
    declaredVersion,
    diagnostic: {
      code: 'unsupported-plugin-api-version',
      message:
        `Plugin API version ${declaredVersion} is outside the supported range ` +
        `${supportedRange.minInclusive}-${supportedRange.maxInclusive}.`,
    },
    status: 'unsupported',
    supportedRange,
  };
};
