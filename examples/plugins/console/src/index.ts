import { defineConsole } from '@platform/console-sdk';

export const orbitPocketConsole = defineConsole({
  console: {
    capabilities: ['cartridge-playback'],
    id: 'org.example.orbit-pocket',
    inputActions: [
      { id: 'up' },
      { id: 'down' },
      { id: 'left' },
      { id: 'right' },
      { id: 'primary-button' },
      { id: 'secondary-button' },
      { id: 'start' },
      { id: 'select' },
    ],
    inputMapping: {
      entries: [
        { consoleAction: 'up', normalizedAction: 'move-up' },
        { consoleAction: 'down', normalizedAction: 'move-down' },
        { consoleAction: 'left', normalizedAction: 'move-left' },
        { consoleAction: 'right', normalizedAction: 'move-right' },
        { consoleAction: 'primary-button', normalizedAction: 'primary' },
        { consoleAction: 'secondary-button', normalizedAction: 'secondary' },
        { consoleAction: 'start', normalizedAction: 'start' },
        { consoleAction: 'select', normalizedAction: 'select' },
      ],
      playerPortId: 'player-one',
      version: 1,
    },
    playerPorts: [{
      id: 'player-one',
      inputActions: [
        'up',
        'down',
        'left',
        'right',
        'primary-button',
        'secondary-button',
        'start',
        'select',
      ],
    }],
    supportedRomExtensions: ['.orbit'],
  },
  manifest: {
    apiVersion: 1,
    capabilities: ['cartridge-playback'],
    id: 'org.example.orbit-pocket',
    name: 'Orbit Pocket',
    permissions: [],
    type: 'console',
    version: '1.0.0',
  },
});

export default orbitPocketConsole;
