import { describe, expect, it, vi } from 'vitest';
import { BrowserUiAudioService } from './index.js';

describe('BrowserUiAudioService', () => {
  it('routes semantic tokens, respects cooldown, and degrades silently', () => {
    const play = vi.fn(async () => undefined);
    const create = vi.fn(() => ({ currentTime: 0, pause: vi.fn(), play, preload: '', volume: 0 }));
    let now = 100;
    const service = new BrowserUiAudioService({ focus: '/focus.wav' }, create, () => now);
    service.play('focus');
    service.play('focus');
    now = 161;
    service.play('focus');
    service.play('error');
    expect(create).toHaveBeenCalledTimes(2);
  });

  it('rate-limits browse independently from ordinary focus', () => {
    const play = vi.fn(async () => undefined);
    const create = vi.fn(() => ({ currentTime: 0, pause: vi.fn(), play, preload: '', volume: 0 }));
    let now = 100;
    const service = new BrowserUiAudioService(
      { browse: '/browse.wav', focus: '/focus.wav' },
      create,
      () => now,
    );
    service.play('browse');
    service.play('focus');
    service.play('browse');
    expect(create).toHaveBeenCalledTimes(2);
    now = 180;
    service.play('browse');
    expect(create).toHaveBeenCalledTimes(3);
  });

  it('rate-limits repeated setting adjustments', () => {
    const play = vi.fn(async () => undefined);
    const create = vi.fn(() => ({ currentTime: 0, pause: vi.fn(), play, preload: '', volume: 0 }));
    let now = 100;
    const service = new BrowserUiAudioService({ adjust: '/adjust.wav' }, create, () => now);
    service.play('adjust');
    service.play('adjust');
    now = 174;
    service.play('adjust');
    now = 175;
    service.play('adjust');
    expect(create).toHaveBeenCalledTimes(2);
  });
});
