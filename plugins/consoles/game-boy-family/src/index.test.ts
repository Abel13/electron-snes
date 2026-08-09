import { validateConsolePlugin } from '@platform/console-sdk';
import { expect, test } from 'vitest';

import { gameBoyFamilyConsole } from './index.js';

test('declares the Game Boy and Game Boy Color family through the console SDK', () => {
  const result = validateConsolePlugin(gameBoyFamilyConsole);

  expect(result.status).toBe('valid');
  expect(gameBoyFamilyConsole.console.supportedRomExtensions).toEqual(['.gb', '.gbc']);
  expect(gameBoyFamilyConsole.console.playerPorts[0]?.inputActions).toEqual([
    'up',
    'down',
    'left',
    'right',
    'a',
    'b',
    'start',
    'select',
  ]);
});
