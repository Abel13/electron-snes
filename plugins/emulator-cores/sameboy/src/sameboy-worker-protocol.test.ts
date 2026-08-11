import { describe, expect, expectTypeOf, it } from 'vitest';

import type {
  SameBoyWorkerCommand,
  SameBoyWorkerMessage,
  SameBoyWorkerRequest,
} from './sameboy-worker-protocol.js';

describe('SameBoy worker protocol', () => {
  it('keeps ROM commands, input commands, and output frames serializable', () => {
    const command: SameBoyWorkerCommand = {
      rom: { bytes: new Uint8Array([1]), extension: '.gbc', name: 'game.gbc' },
      type: 'load-rom',
    };
    const request: SameBoyWorkerRequest = { ...command, id: 'sameboy-1' };
    const message: SameBoyWorkerMessage = {
      height: 144,
      pixels: new Uint8Array(160 * 144 * 4),
      type: 'video',
      width: 160,
    };

    expectTypeOf(request.id).toEqualTypeOf<string>();
    expectTypeOf(message.pixels).toEqualTypeOf<Uint8Array>();
    const saveMessage: SameBoyWorkerMessage = {
      save: { bytes: new Uint8Array([1, 2]) },
      type: 'cartridge-save',
    };
    expectTypeOf(saveMessage.save.bytes).toEqualTypeOf<Uint8Array>();
  });

  it('carries rewind hold and release commands without state payloads', () => {
    const start: SameBoyWorkerCommand = { active: true, type: 'set-rewind-active' };
    const stop: SameBoyWorkerRequest = {
      active: false,
      id: 'sameboy-rewind-1',
      type: 'set-rewind-active',
    };
    expect(start.active).toBe(true);
    expect(stop.active).toBe(false);
  });

  it('carries fast-forward hold and release commands without speed payloads', () => {
    const start: SameBoyWorkerCommand = { active: true, type: 'set-fast-forward-active' };
    const stop: SameBoyWorkerRequest = {
      active: false,
      id: 'sameboy-fast-forward-1',
      type: 'set-fast-forward-active',
    };
    expect(start.active).toBe(true);
    expect(stop.active).toBe(false);
  });
});
