import { validatePluginContract } from '@platform/plugin-test';
import { expect, test } from 'vitest';

import { gameBoyFamilyConsole } from './index.js';

test('declares the Game Boy and Game Boy Color family through the console SDK', () => {
  const result = validatePluginContract(gameBoyFamilyConsole);

  expect(result.status).toBe('valid');
  expect(gameBoyFamilyConsole.console.supportedRomExtensions).toEqual(['.gb', '.gbc']);
  expect(gameBoyFamilyConsole.console.playerPorts[0]?.inputActions).toEqual([
    'up',
    'left',
    'right',
    'down',
    'select',
    'start',
    'b',
    'a',
  ]);
});
