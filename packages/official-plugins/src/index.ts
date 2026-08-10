import { sameBoyEmulator } from '@platform/plugin-emulator-sameboy';
import { gameBoyFamilyConsole } from '@platform/plugin-console-game-boy-family';
import type { ConsolePluginDefinition } from '@platform/console-sdk';
import type { EmulatorPluginDefinition } from '@platform/emulator-sdk';

const officialEmulatorPlugins = new Map<string, EmulatorPluginDefinition>([
  [sameBoyEmulator.emulator.id, sameBoyEmulator],
]);
const officialConsolePlugins = new Map<string, ConsolePluginDefinition>([
  [gameBoyFamilyConsole.console.id, gameBoyFamilyConsole],
]);

export const resolveOfficialConsolePlugin = (id: string): ConsolePluginDefinition | undefined =>
  officialConsolePlugins.get(id);

/** Resolves an audited official plugin without exposing plugin modules to an application host. */
export const resolveOfficialEmulatorPlugin = (id: string): EmulatorPluginDefinition | undefined =>
  officialEmulatorPlugins.get(id);
