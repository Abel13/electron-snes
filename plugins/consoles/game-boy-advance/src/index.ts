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
      cartridgeLabelMap: {
        aspectRatio: 1,
        topLeft: { x: 23.5, y: 32.5, radius: 8 },
        topRight: { x: 77, y: 40.5, radius: 8 },
        bottomRight: { x: 72, y: 66, radius: 8 },
        bottomLeft: { x: 18, y: 56.5, radius: 8 },
      },
      blueprint: 'assets/blueprints/game-boy-advance-blueprint.png',
      controlDiagram: {
        alt: 'Game Boy Advance control blueprint',
        aspectRatio: 3 / 2,
        scale: 0.55,
        controlPoints: [
          { action: 'l', slot: 'left-01', x: 17, y: 18 },
          { action: 'up', slot: 'left-04', x: 15, y: 35 },
          { action: 'left', slot: 'left-05', x: 9, y: 45 },
          { action: 'right', slot: 'left-06', x: 22, y: 45 },
          { action: 'down', slot: 'left-07', x: 15, y: 55 },
          { action: 'start', slot: 'left-10', x: 18, y: 62 },
          { action: 'select', slot: 'left-12', x: 18, y: 68 },
          { action: 'r', slot: 'right-01', x: 83, y: 18 },
          { action: 'a', slot: 'right-04', x: 89, y: 42 },
          { action: 'b', slot: 'right-06', x: 82, y: 49 },
        ],
      },
    },
    generationKey: 'generationHandheld',
    maxRomBytes: 32 * 1024 * 1024,
    capabilities: ['cartridge-playback', 'wide-portable-video'],
    id: 'org.pixelcore.game-boy-advance',
    identifyRom,
    inputActions: [
      { id: 'l' },
      { id: 'up' },
      { id: 'left' },
      { id: 'right' },
      { id: 'down' },
      { id: 'start' },
      { id: 'select' },
      { id: 'r' },
      { id: 'a' },
      { id: 'b' },
    ],
    inputMapping: {
      entries: [
        { consoleAction: 'l', normalizedAction: 'left-shoulder' },
        { consoleAction: 'up', normalizedAction: 'move-up' },
        { consoleAction: 'left', normalizedAction: 'move-left' },
        { consoleAction: 'right', normalizedAction: 'move-right' },
        { consoleAction: 'down', normalizedAction: 'move-down' },
        { consoleAction: 'start', normalizedAction: 'start' },
        { consoleAction: 'select', normalizedAction: 'select' },
        { consoleAction: 'r', normalizedAction: 'right-shoulder' },
        { consoleAction: 'a', normalizedAction: 'primary' },
        { consoleAction: 'b', normalizedAction: 'secondary' },
      ],
      playerPortId: 'player-one',
      version: 1,
    },
    playerPorts: [
      {
        id: 'player-one',
        inputActions: ['l', 'up', 'left', 'right', 'down', 'start', 'select', 'r', 'a', 'b'],
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
