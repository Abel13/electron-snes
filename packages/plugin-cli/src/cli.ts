#!/usr/bin/env node
import { createPluginScaffold, PLUGIN_SCAFFOLD_TYPES } from './scaffold.js';
import type { PluginScaffoldType } from './scaffold.js';

const usage = `Usage:
  pixelcore-plugin create --type <type> --id <reverse-dns-id> --name <name> --output <path>

Types: ${PLUGIN_SCAFFOLD_TYPES.join(', ')}
`;

const readArguments = (arguments_: readonly string[]): Record<string, string> => {
  const values: Record<string, string> = {};
  for (let index = 0; index < arguments_.length; index += 2) {
    const flag = arguments_[index];
    const value = arguments_[index + 1];
    if (flag === undefined || !flag.startsWith('--') || value === undefined)
      throw new Error(usage);
    values[flag.slice(2)] = value;
  }
  return values;
};

const main = async (): Promise<void> => {
  const [command, ...arguments_] = process.argv.slice(2);
  if (command !== 'create') throw new Error(usage);
  const values = readArguments(arguments_);
  const type = values['type'];
  if (!PLUGIN_SCAFFOLD_TYPES.includes(type as PluginScaffoldType)) throw new Error(usage);
  const id = values['id'];
  const name = values['name'];
  const output = values['output'];
  if (id === undefined || name === undefined || output === undefined) throw new Error(usage);

  const created = await createPluginScaffold({ id, name, output, type: type as PluginScaffoldType });
  process.stdout.write(`Created ${created.directory}\n`);
};

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : 'Plugin scaffold failed.'}\n`);
  process.exitCode = 1;
});
