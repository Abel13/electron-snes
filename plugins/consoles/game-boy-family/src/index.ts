import { defineConsole } from '@platform/console-sdk';

export const gameBoyFamilyAssetRoot = new URL('../assets/', import.meta.url);

export const gameBoyFamilyConsole = defineConsole({
  console: {
    assets: {
      cartridge: 'assets/cartridges/game-boy-family-cartridge.webp',
      consoleHero: 'assets/consoles/game-boy-family-console-hero.webp',
      blueprint: 'assets/blueprints/game-boy-family-blueprint.png',
      controlDiagram: {
        alt: 'Game Boy Family control blueprint',
        controlPoints: [
          { action: 'up', x: 32, y: 53 },
          { action: 'down', x: 32, y: 67 },
          { action: 'left', x: 22, y: 60 },
          { action: 'right', x: 42, y: 60 },
          { action: 'a', x: 73, y: 57.5 },
          { action: 'b', x: 62, y: 62.5 },
          { action: 'start', x: 54, y: 73.3 },
          { action: 'select', x: 41, y: 73.3 },
        ],
      },
    },
    generationKey: 'generationHandheld',
    capabilities: ['cartridge-playback'],
    id: 'org.pixelcore.game-boy-family',
    identifyRom: (bytes: Uint8Array) => {
      if (bytes.byteLength < 0x144) return [];
      const titleEnd = bytes[0x143] === 0x80 || bytes[0x143] === 0xc0 ? 0x143 : 0x144;
      const title = String.fromCharCode(...bytes.slice(0x134, titleEnd))
        .replaceAll('\0', '')
        .trim();
      return /^[\x20-\x7e]{1,16}$/.test(title)
        ? [{ namespace: 'game-boy-header-title', value: title }]
        : [];
    },
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
