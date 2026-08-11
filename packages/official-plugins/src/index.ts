import { sameBoyEmulator } from '@platform/plugin-emulator-sameboy';
import { gameBoyFamilyConsole } from '@platform/plugin-console-game-boy-family';
import type { ConsolePluginDefinition } from '@platform/console-sdk';
import type { EmulatorPluginDefinition } from '@platform/emulator-sdk';
import type { GameMetadataPluginDefinition } from '@platform/game-sdk';
import { validateGameMetadataPlugin } from '@platform/game-sdk';
import { referenceGameCatalog } from '@platform/example-game-reference-catalog';

const officialEmulatorPlugins = new Map<string, EmulatorPluginDefinition>([
  [sameBoyEmulator.emulator.id, sameBoyEmulator],
]);
const officialConsolePlugins = new Map<string, ConsolePluginDefinition>([
  [gameBoyFamilyConsole.console.id, gameBoyFamilyConsole],
]);
const gameMetadataValidation = validateGameMetadataPlugin(referenceGameCatalog);
if (gameMetadataValidation.status !== 'valid')
  throw new Error('The official game metadata catalog is invalid.');
const officialGameMetadataPlugins: readonly GameMetadataPluginDefinition[] = [
  gameMetadataValidation.definition,
];

export const resolveOfficialConsolePlugin = (id: string): ConsolePluginDefinition | undefined =>
  officialConsolePlugins.get(id);

/** Lists validated official console plugin identifiers without exposing concrete definitions. */
export const listOfficialConsolePluginIds = (): readonly string[] =>
  [...officialConsolePlugins.keys()].sort();

/** Resolves an audited official plugin without exposing plugin modules to an application host. */
export const resolveOfficialEmulatorPlugin = (id: string): EmulatorPluginDefinition | undefined =>
  officialEmulatorPlugins.get(id);

export const listOfficialGameMetadataPlugins = (): readonly GameMetadataPluginDefinition[] =>
  officialGameMetadataPlugins;
