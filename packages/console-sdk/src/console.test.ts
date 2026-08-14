import { expect, test } from 'vitest';

import { defineConsole, validateConsolePlugin } from './console.js';

const gameBoyConsole = defineConsole({
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
    maxRomBytes: 8 * 1024 * 1024,
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

test('accepts a generic Game Boy family console declaration', () => {
  const result = validateConsolePlugin(gameBoyConsole);

  expect(result.status).toBe('valid');
});

test('rejects an unsafe ROM size limit', () => {
  const result = validateConsolePlugin({
    ...gameBoyConsole,
    console: { ...gameBoyConsole.console, maxRomBytes: 65 * 1024 * 1024 },
  });

  expect(result.status).toBe('invalid');
  if (result.status === 'invalid') {
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({ path: ['console', 'maxRomBytes'] }),
    );
  }
});

test('rejects a declaration with an action missing from its player port', () => {
  const result = validateConsolePlugin({
    ...gameBoyConsole,
    console: {
      ...gameBoyConsole.console,
      playerPorts: [{ id: 'player-one', inputActions: ['up', 'unknown-action'] }],
    },
  });

  expect(result.status).toBe('invalid');

  if (result.status === 'invalid') {
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({ path: ['console', 'playerPorts', 0, 'inputActions'] }),
    );
  }
});

test('rejects a plugin manifest that is not a console', () => {
  const result = validateConsolePlugin({
    ...gameBoyConsole,
    manifest: { ...gameBoyConsole.manifest, type: 'controller' },
  });

  expect(result.status).toBe('invalid');

  if (result.status === 'invalid') {
    expect(result.diagnostics[0]?.code).toBe('console-manifest-type-invalid');
  }
});

test('accepts normalized plugin-owned visual assets', () => {
  const result = validateConsolePlugin({
    ...gameBoyConsole,
    console: {
      ...gameBoyConsole.console,
      assets: {
        consoleHero: 'assets/consoles/game-boy-family-console-hero.png',
        blueprint: 'assets/blueprints/game-boy-family-blueprint.png',
        sessionBackdrop: 'assets/backdrops/game-boy-family-session-backdrop.png',
      },
    },
  });

  expect(result.status).toBe('valid');
});

test('rejects a cartridge asset without its label map', () => {
  const result = validateConsolePlugin({
    ...gameBoyConsole,
    console: {
      ...gameBoyConsole.console,
      assets: {
        consoleHero: 'assets/consoles/game-boy-family-console-hero.png',
        cartridge: 'assets/cartridges/game-boy-family-cartridge.webp',
      },
    },
  });

  expect(result.status).toBe('invalid');
  if (result.status === 'invalid') {
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({ path: ['console', 'assets', 'cartridgeLabelMap'] }),
    );
  }
});

test('accepts console-specific cartridge label geometry', () => {
  const result = validateConsolePlugin({
    ...gameBoyConsole,
    console: {
      ...gameBoyConsole.console,
      assets: {
        consoleHero: 'assets/consoles/game-boy-family-console-hero.png',
        cartridge: 'assets/cartridges/game-boy-family-cartridge.webp',
        cartridgeLabelMap: {
          aspectRatio: 1,
          topLeft: { x: 27, y: 14.5, radius: 3 },
          topRight: { x: 87, y: 14.5, radius: 3 },
          bottomRight: { x: 87, y: 73.5, radius: 3 },
          bottomLeft: { x: 27, y: 73.5, radius: 3 },
        },
      },
    },
  });

  expect(result.status).toBe('valid');
});

test('rejects cartridge label geometry outside the cartridge canvas', () => {
  const result = validateConsolePlugin({
    ...gameBoyConsole,
    console: {
      ...gameBoyConsole.console,
      assets: {
        consoleHero: 'assets/consoles/game-boy-family-console-hero.png',
        cartridge: 'assets/cartridges/game-boy-family-cartridge.webp',
        cartridgeLabelMap: {
          aspectRatio: 1,
          topLeft: { x: 40, y: 20, radius: 3 },
          topRight: { x: 110, y: 20, radius: 3 },
          bottomRight: { x: 110, y: 90, radius: 3 },
          bottomLeft: { x: 40, y: 90, radius: 3 },
        },
      },
    },
  });

  expect(result.status).toBe('invalid');
});

test('rejects negative corner radius and degenerate label geometry', () => {
  const result = validateConsolePlugin({
    ...gameBoyConsole,
    console: {
      ...gameBoyConsole.console,
      assets: {
        consoleHero: 'assets/consoles/game-boy-family-console-hero.png',
        cartridge: 'assets/cartridges/game-boy-family-cartridge.webp',
        cartridgeLabelMap: {
          aspectRatio: 1,
          topLeft: { x: 20, y: 20, radius: -1 },
          topRight: { x: 20, y: 20, radius: 3 },
          bottomRight: { x: 20, y: 20, radius: 3 },
          bottomLeft: { x: 20, y: 20, radius: 3 },
        },
      },
    },
  });

  expect(result.status).toBe('invalid');
});

test.each(['../outside.png', '/absolute.png', 'https://example.com/hero.png', 'assets/hero.jpg'])(
  'rejects unsafe console asset reference %s',
  (asset) => {
    const result = validateConsolePlugin({
      ...gameBoyConsole,
      console: {
        ...gameBoyConsole.console,
        assets: { consoleHero: asset },
      },
    });

    expect(result.status).toBe('invalid');
  },
);

test('rejects an asset profile without a console hero', () => {
  const result = validateConsolePlugin({
    ...gameBoyConsole,
    console: {
      ...gameBoyConsole.console,
      assets: { blueprint: 'assets/blueprints/game-boy-family-blueprint.png' },
    },
  });

  expect(result.status).toBe('invalid');
});
