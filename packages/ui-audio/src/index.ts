export const UI_SOUND_TOKENS = [
  'startup',
  'browse',
  'adjust',
  'focus',
  'select',
  'back',
  'open',
  'toggle-on',
  'toggle-off',
  'favorite-add',
  'favorite-remove',
  'success',
  'warning',
  'error',
  'launch',
  'pause',
  'resume',
] as const;

export type UiSoundToken = (typeof UI_SOUND_TOKENS)[number];

export interface UiAudioPreferences {
  readonly muted: boolean;
  readonly volume: number;
}

export interface UiAudioService {
  play(token: UiSoundToken): void;
  setPreferences(preferences: UiAudioPreferences): void;
}

export interface AudioElementLike {
  currentTime: number;
  preload: string;
  volume: number;
  play(): Promise<void>;
  pause(): void;
}

const cooldowns: Partial<Record<UiSoundToken, number>> = { adjust: 75, browse: 80, focus: 60 };

export class BrowserUiAudioService implements UiAudioService {
  private preferences: UiAudioPreferences = { muted: false, volume: 0.22 };
  private readonly lastPlayed = new Map<UiSoundToken, number>();

  public constructor(
    private readonly sources: Readonly<Partial<Record<UiSoundToken, string>>>,
    private readonly createAudio: (source: string) => AudioElementLike = (source) =>
      new Audio(source),
    private readonly now: () => number = () => performance.now(),
  ) {}

  public play(token: UiSoundToken): void {
    if (this.preferences.muted || this.preferences.volume <= 0) return;
    const source = this.sources[token];
    if (source === undefined) return;
    const now = this.now();
    const cooldown = cooldowns[token] ?? 0;
    if (now - (this.lastPlayed.get(token) ?? -Infinity) < cooldown) return;
    this.lastPlayed.set(token, now);
    try {
      const audio = this.createAudio(source);
      audio.preload = 'auto';
      audio.volume = Math.min(1, Math.max(0, this.preferences.volume));
      void audio.play().catch(() => undefined);
    } catch {
      // UI audio is enhancement only and must never block an interaction.
    }
  }

  public setPreferences(preferences: UiAudioPreferences): void {
    this.preferences = {
      muted: preferences.muted,
      volume: Math.min(1, Math.max(0, preferences.volume)),
    };
  }
}
