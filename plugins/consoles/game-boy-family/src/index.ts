import { defineConsole } from '@platform/console-sdk';

export const gameBoyFamilyConsole = defineConsole({
  console: {
    capabilities: ['cartridge-playback'],
    id: 'org.pixelcore.game-boy-family',
    inputActions: [
      { id: 'up' },
      { id: 'down' },
      { id: 'left' },
      { id: 'right' },
      { id: 'a' },
      { id: 'b' },
      { id: 'start' },
      { id: 'select' },
    ],
    inputMapping: {
      entries: [
        { consoleAction: 'up', normalizedAction: 'move-up' },
        { consoleAction: 'down', normalizedAction: 'move-down' },
        { consoleAction: 'left', normalizedAction: 'move-left' },
        { consoleAction: 'right', normalizedAction: 'move-right' },
        { consoleAction: 'a', normalizedAction: 'primary' },
        { consoleAction: 'b', normalizedAction: 'secondary' },
        { consoleAction: 'start', normalizedAction: 'start' },
        { consoleAction: 'select', normalizedAction: 'select' },
      ],
      playerPortId: 'player-one',
      version: 1,
    },
    playerPorts: [
      {
        id: 'player-one',
        inputActions: ['up', 'down', 'left', 'right', 'a', 'b', 'start', 'select'],
      },
    ],
    supportedRomExtensions: ['.gb', '.gbc'],
  },
  manifest: {
    apiVersion: 1,
    capabilities: ['cartridge-playback'],
    id: 'org.pixelcore.game-boy-family',
    name: 'Game Boy Family',
    permissions: [],
    type: 'console',
    version: '1.0.0',
  },
});
