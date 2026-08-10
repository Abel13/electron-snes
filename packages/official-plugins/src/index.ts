import { sameBoyEmulator } from '@platform/plugin-emulator-sameboy';
import type { EmulatorPluginDefinition } from '@platform/emulator-sdk';

const officialEmulatorPlugins = new Map<string, EmulatorPluginDefinition>([
  [sameBoyEmulator.emulator.id, sameBoyEmulator],
]);

/** Resolves an audited official plugin without exposing plugin modules to an application host. */
export const resolveOfficialEmulatorPlugin = (id: string): EmulatorPluginDefinition | undefined =>
  officialEmulatorPlugins.get(id);
