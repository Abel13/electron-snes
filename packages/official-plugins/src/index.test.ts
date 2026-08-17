import { describe, expect, it } from 'vitest';

import { resolveOfficialConsoleForExtension, resolveOfficialEmulatorForConsole } from './index.js';

describe('official plugin resolution', () => {
  it('resolves consoles and cores through declared compatibility', () => {
    const consolePlugin = resolveOfficialConsoleForExtension('.gba');
    if (consolePlugin === undefined) throw new Error('Expected an official GBA console plugin.');

    const emulatorPlugin = resolveOfficialEmulatorForConsole(consolePlugin.console.id, '.gba');

    expect(consolePlugin.console.id).toBe('org.pixelcore.game-boy-advance');
    expect(emulatorPlugin?.emulator.id).toBe('org.pixelcore.mgba');
    expect(resolveOfficialEmulatorForConsole(consolePlugin.console.id, '.gb')).toBeUndefined();
  });
});
