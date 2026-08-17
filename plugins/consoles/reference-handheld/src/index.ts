import { defineConsole } from '@platform/console-sdk';

export const referenceHandheldConsole = defineConsole({
  console: {
    capabilities: ['cartridge-playback'],
    id: 'org.pixelcore.example.reference-handheld',
    inputActions: [{ id: 'left' }, { id: 'right' }, { id: 'action' }],
    inputMapping: {
      entries: [
        { consoleAction: 'left', normalizedAction: 'move-left' },
        { consoleAction: 'right', normalizedAction: 'move-right' },
        { consoleAction: 'action', normalizedAction: 'primary' },
      ],
      playerPortId: 'player-one',
      version: 1,
    },
    playerPorts: [{ id: 'player-one', inputActions: ['left', 'right', 'action'] }],
    maxRomBytes: 8 * 1024 * 1024,
    supportedRomExtensions: ['.demo'],
  },
  manifest: {
    apiVersion: 1,
    capabilities: ['cartridge-playback'],
    id: 'org.pixelcore.example.reference-handheld',
    name: 'Reference Handheld',
    permissions: [],
    type: 'console',
    version: '1.0.0',
  },
});
