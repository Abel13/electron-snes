import { defineEmulator } from '@platform/emulator-sdk';

import { createSameBoySession } from './sameboy-session.js';

export const sameBoyEmulator = defineEmulator({
  createSession: createSameBoySession,
  emulator: {
    capabilities: {
      fastForward: false,
      rewind: false,
      saveStates: true,
    },
    compatibleConsoleIds: ['org.pixelcore.game-boy-family'],
    id: 'org.pixelcore.sameboy',
    supportedRomExtensions: ['.gb', '.gbc'],
  },
  manifest: {
    apiVersion: 1,
    capabilities: ['audio-output', 'video-output', 'game-boy-family'],
    id: 'org.pixelcore.sameboy',
    name: 'SameBoy',
    permissions: [],
    type: 'emulator-core',
    version: '1.0.3',
  },
});

export { createSameBoySession } from './sameboy-session.js';
