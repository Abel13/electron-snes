import { defineConsole } from '@platform/console-sdk';

export const gameBoyAdvanceAssetRoot = new URL('../assets/', import.meta.url);

const GBA_HEADER_SIZE = 0xb0;
const TITLE_OFFSET = 0xa0;
const TITLE_LENGTH = 12;

const isPrintableAscii = (value: number): boolean => value >= 0x20 && value <= 0x7e;

const identifyRom = (bytes: Uint8Array) => {
  if (bytes.byteLength < GBA_HEADER_SIZE) return [];
  const titleBytes = bytes.slice(TITLE_OFFSET, TITLE_OFFSET + TITLE_LENGTH);
  const title = String.fromCharCode(...titleBytes)
    .replaceAll('\0', '')
    .trim();
  const gameCode = String.fromCharCode(...bytes.slice(0xac, 0xb0));
  if (
    title.length === 0 ||
    ![...titleBytes].every((value) => value === 0 || isPrintableAscii(value)) ||
    !/^[A-Z0-9]{4}$/.test(gameCode)
  )
    return [];
  return [
    { namespace: 'gba-header-title', value: title },
    { namespace: 'gba-game-code', value: gameCode },
  ];
};

export const gameBoyAdvanceConsole = defineConsole({
  console: {
    assets: {
      sessionBackdrop: 'assets/backdrops/game-boy-advance-session-backdrop.png',
      cartridge: 'assets/cartridges/game-boy-advance-cartridge.webp',
      consoleHero: 'assets/consoles/game-boy-advance-console-hero.png',
      blueprint: 'assets/blueprints/game-boy-advance-blueprint.png',
      controlDiagram: {
        alt: 'Game Boy Advance control blueprint',
        controlPoints: [
          { action: 'up', x: 32, y: 45 },
          { action: 'down', x: 32, y: 64 },
          { action: 'left', x: 24, y: 54 },
          { action: 'right', x: 40, y: 54 },
          { action: 'a', x: 69, y: 42 },
          { action: 'b', x: 77, y: 52 },
          { action: 'l', x: 25, y: 18 },
          { action: 'r', x: 75, y: 18 },
          { action: 'start', x: 58, y: 72 },
          { action: 'select', x: 42, y: 72 },
        ],
      },
    },
    generationKey: 'generationHandheld',
    maxRomBytes: 32 * 1024 * 1024,
    capabilities: ['cartridge-playback', 'wide-portable-video'],
    id: 'org.pixelcore.game-boy-advance',
    identifyRom,
    inputActions: [
      { id: 'up' },
      { id: 'down' },
      { id: 'left' },
      { id: 'right' },
      { id: 'a' },
      { id: 'b' },
      { id: 'l' },
      { id: 'r' },
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
        { consoleAction: 'l', normalizedAction: 'left-shoulder' },
        { consoleAction: 'r', normalizedAction: 'right-shoulder' },
        { consoleAction: 'start', normalizedAction: 'start' },
        { consoleAction: 'select', normalizedAction: 'select' },
      ],
      playerPortId: 'player-one',
      version: 1,
    },
    playerPorts: [
      {
        id: 'player-one',
        inputActions: ['up', 'down', 'left', 'right', 'a', 'b', 'l', 'r', 'start', 'select'],
      },
    ],
    supportedRomExtensions: ['.gba'],
    videoPresentation: {
      nativeResolution: { width: 240, height: 160 },
      scalingModes: ['pixel-perfect', 'fit'],
      defaultScalingMode: 'pixel-perfect',
      allowCrop: false,
      filtering: 'nearest',
      scene: {
        layout: 'portable-wide',
        frameStyle: 'gba-wide-frame',
        backdropStyle: 'gba-wide-backdrop',
        accent: '#6edcff',
      },
    },
  },
  manifest: {
    apiVersion: 1,
    capabilities: ['cartridge-playback', 'wide-portable-video'],
    id: 'org.pixelcore.game-boy-advance',
    name: 'Game Boy Advance',
    permissions: [],
    type: 'console',
    version: '1.0.0',
  },
});
