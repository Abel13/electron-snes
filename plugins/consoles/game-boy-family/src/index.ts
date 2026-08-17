import { defineConsole } from '@platform/console-sdk';

export const gameBoyFamilyAssetRoot = new URL('../assets/', import.meta.url);

export const gameBoyFamilyConsole = defineConsole({
  console: {
    assets: {
      cartridge: 'assets/cartridges/game-boy-family-cartridge.webp',
      cartridgeLabelMap: {
        aspectRatio: 1,
        topLeft: { x: 27, y: 14.5, radius: 5 },
        bottomLeft: { x: 27, y: 73.7, radius: 5 },
        topRight: { x: 79.5, y: 19.8, radius: 5 },
        bottomRight: { x: 79.5, y: 73.7, radius: 5 },
      },
      consoleHero: 'assets/consoles/game-boy-family-console-hero.webp',
      blueprint: 'assets/blueprints/game-boy-family-blueprint.png',
      controlDiagram: {
        alt: 'Game Boy Family control blueprint',
        aspectRatio: 2 / 3,
        controlPoints: [
          { action: 'up', slot: 'left-04', x: 32, y: 53 },
          { action: 'left', slot: 'left-06', x: 22, y: 60 },
          { action: 'right', slot: 'left-08', x: 42, y: 60 },
          { action: 'down', slot: 'left-10', x: 32, y: 67 },
          { action: 'select', slot: 'left-12', x: 41, y: 73.3 },
          { action: 'start', slot: 'right-12', x: 54, y: 73.3 },
          { action: 'b', slot: 'right-07', x: 62, y: 62.5 },
          { action: 'a', slot: 'right-05', x: 73, y: 57.5 },
        ],
      },
    },
    generationKey: 'generationHandheld',
    maxRomBytes: 8 * 1024 * 1024,
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
      { id: 'left' },
      { id: 'right' },
      { id: 'down' },
      { id: 'select' },
      { id: 'start' },
      { id: 'b' },
      { id: 'a' },
    ],
    inputMapping: {
      entries: [
        { consoleAction: 'up', normalizedAction: 'move-up' },
        { consoleAction: 'left', normalizedAction: 'move-left' },
        { consoleAction: 'right', normalizedAction: 'move-right' },
        { consoleAction: 'down', normalizedAction: 'move-down' },
        { consoleAction: 'select', normalizedAction: 'select' },
        { consoleAction: 'a', normalizedAction: 'primary' },
        { consoleAction: 'b', normalizedAction: 'secondary' },
        { consoleAction: 'start', normalizedAction: 'start' },
      ],
      playerPortId: 'player-one',
      version: 1,
    },
    playerPorts: [
      {
        id: 'player-one',
        inputActions: ['up', 'left', 'right', 'down', 'select', 'start', 'b', 'a'],
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
