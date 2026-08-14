import { defineEmulator } from '@platform/emulator-sdk';
import { createMgbaSession } from './mgba-session.js';

export const mgbaEmulator = defineEmulator({
  createSession: createMgbaSession,
  emulator: {
    capabilities: { fastForward: false, rewind: false, saveStates: true },
    compatibleConsoleIds: ['org.pixelcore.game-boy-advance'],
    id: 'org.pixelcore.mgba',
    supportedRomExtensions: ['.gba'],
  },
  manifest: {
    apiVersion: 1,
    capabilities: ['audio-output', 'video-output', 'game-boy-advance', 'cartridge-saves', 'save-states'],
    id: 'org.pixelcore.mgba',
    name: 'mGBA',
    permissions: [],
    type: 'emulator-core',
    version: '0.1.0',
  },
});

export { createMgbaSession } from './mgba-session.js';
