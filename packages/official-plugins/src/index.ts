import { sameBoyEmulator } from '@platform/plugin-emulator-sameboy';
import { mgbaEmulator } from '@platform/plugin-emulator-mgba';
import {
  gameBoyAdvanceAssetRoot,
  gameBoyAdvanceConsole,
} from '@platform/plugin-console-game-boy-advance';
import {
  gameBoyFamilyAssetRoot,
  gameBoyFamilyConsole,
} from '@platform/plugin-console-game-boy-family';
import type { ConsolePluginDefinition } from '@platform/console-sdk';
import type { EmulatorPluginDefinition } from '@platform/emulator-sdk';
import type { GameMetadataPluginDefinition } from '@platform/game-sdk';
import { validateGameMetadataPlugin } from '@platform/game-sdk';
import { referenceGameCatalog } from '@platform/example-game-reference-catalog';
import { gameBoyAdvanceExampleCatalog } from '@platform/example-game-boy-advance-catalog';

const officialEmulatorPlugins = new Map<string, EmulatorPluginDefinition>([
  [mgbaEmulator.emulator.id, mgbaEmulator],
  [sameBoyEmulator.emulator.id, sameBoyEmulator],
]);
const officialConsolePlugins = new Map<string, ConsolePluginDefinition>([
  [gameBoyAdvanceConsole.console.id, gameBoyAdvanceConsole],
  [gameBoyFamilyConsole.console.id, gameBoyFamilyConsole],
]);
const officialConsoleAssetRoots = new Map<string, URL>([
  [gameBoyAdvanceConsole.console.id, gameBoyAdvanceAssetRoot],
  [gameBoyFamilyConsole.console.id, gameBoyFamilyAssetRoot],
]);
const gameMetadataValidation = validateGameMetadataPlugin(referenceGameCatalog);
if (gameMetadataValidation.status !== 'valid')
  throw new Error('The official game metadata catalog is invalid.');
const officialGameMetadataPlugins: readonly GameMetadataPluginDefinition[] = [
  gameMetadataValidation.definition,
];

export const resolveOfficialConsolePlugin = (id: string): ConsolePluginDefinition | undefined =>
  officialConsolePlugins.get(id);

/** Resolves the official console that declares support for a ROM extension. */
export const resolveOfficialConsoleForExtension = (
  extension: string,
): ConsolePluginDefinition | undefined =>
  [...officialConsolePlugins.values()].find((plugin) =>
    plugin.console.supportedRomExtensions.includes(extension),
  );

export const resolveOfficialConsoleAssetRoot = (id: string): URL | undefined =>
  officialConsoleAssetRoots.get(id);

/** Lists validated official console plugin identifiers without exposing concrete definitions. */
export const listOfficialConsolePluginIds = (): readonly string[] =>
  [...officialConsolePlugins.keys()].sort();

/** Resolves an audited official plugin without exposing plugin modules to an application host. */
export const resolveOfficialEmulatorPlugin = (id: string): EmulatorPluginDefinition | undefined =>
  officialEmulatorPlugins.get(id);

/** Resolves an official emulator through its declared console and ROM compatibility. */
export const resolveOfficialEmulatorForConsole = (
  consoleId: string,
  extension: string,
): EmulatorPluginDefinition | undefined =>
  [...officialEmulatorPlugins.values()].find(
    (plugin) =>
      plugin.emulator.compatibleConsoleIds.includes(consoleId) &&
      plugin.emulator.supportedRomExtensions.includes(extension),
  );

const gbaGameMetadataValidation = validateGameMetadataPlugin(gameBoyAdvanceExampleCatalog);
if (gbaGameMetadataValidation.status !== 'valid')
  throw new Error('The official GBA game metadata catalog is invalid.');

export const listOfficialGameMetadataPlugins = (): readonly GameMetadataPluginDefinition[] => [
  ...officialGameMetadataPlugins,
  gbaGameMetadataValidation.definition,
];
