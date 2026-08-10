import { createRoot } from 'react-dom/client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  GamepadInputAdapter,
  InputDeviceDiscovery,
  KeyboardInputAdapter,
  UniversalInputRuntime,
  type ConsoleInputMapping,
  type InputDeviceDescriptor,
  type InputProfile,
  type NormalizedInputAction,
} from '@platform/input';
import {
  EmulatorAudioPlayer,
  EmulatorVideoCanvas,
  Icon,
  InputMappingSettings,
  LibraryShell,
  moveDirectionalFocus,
  ParticleField,
  type ProductCopy,
  type ProductView,
} from '@platform/ui';
import { BrowserUiAudioService } from '@platform/ui-audio';
import type { LibraryGame, PixelCoreApi, SessionVideoFrame } from './ipc.js';
import i18n, { setLocale, type SupportedLocale } from './localization.js';
import './renderer.css';

declare global {
  interface Window {
    readonly pixelCore: PixelCoreApi;
  }
}

const logoUrl = new URL('../assets/brand/pixelcore-logo.png', import.meta.url).href;
const defaultArtworkUrl = new URL('../assets/library/default-game-cover.png', import.meta.url).href;
const soundUrl = (name: string): string =>
  new URL(`../assets/audio/${name}.wav`, import.meta.url).href;
const uiAudio = new BrowserUiAudioService({
  back: soundUrl('close'),
  error: soundUrl('error'),
  'favorite-add': soundUrl('favorite-add'),
  'favorite-remove': soundUrl('favorite-remove'),
  focus: soundUrl('focus'),
  launch: soundUrl('launch'),
  open: soundUrl('open'),
  pause: soundUrl('pause'),
  resume: soundUrl('resume'),
  select: soundUrl('select'),
  startup: soundUrl('startup'),
  success: soundUrl('success'),
  'toggle-off': soundUrl('toggle'),
  'toggle-on': soundUrl('toggle'),
  warning: soundUrl('warning'),
});

type ProductStatus = 'error' | 'loading' | 'paused' | 'ready' | 'running' | 'starting' | 'stopped';

const App = (): React.JSX.Element => {
  const { t } = useTranslation();
  const [frame, setFrame] = useState<SessionVideoFrame>();
  const [message, setMessage] = useState(t('sessionReady'));
  const [status, setStatus] = useState<ProductStatus>('loading');
  const [games, setGames] = useState<readonly LibraryGame[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string>();
  const [view, setView] = useState<ProductView>('library');
  const [query, setQuery] = useState('');
  const [uiAudioMuted, setUiAudioMuted] = useState(
    () => localStorage.getItem('pixelcore.uiAudioMuted') === 'true',
  );
  const [uiAudioVolume, setUiAudioVolume] = useState(() =>
    Number(localStorage.getItem('pixelcore.uiAudioVolume') ?? '0.22'),
  );
  const audio = useRef(new EmulatorAudioPlayer());
  const keyboard = useRef(new KeyboardInputAdapter());
  const gamepad = useRef(new GamepadInputAdapter());
  const inputRuntime = useRef(new UniversalInputRuntime());
  const [devices, setDevices] = useState<readonly InputDeviceDescriptor[]>([]);
  const [profile, setProfile] = useState<InputProfile>();
  const profileRef = useRef<InputProfile | undefined>(undefined);
  const statusRef = useRef<ProductStatus>(status);

  const copy: ProductCopy = {
    addGame: t('addGame'),
    allGames: t('allGames'),
    archive: t('archive'),
    artwork: t('artwork'),
    emptyAction: t('emptyAction'),
    emptyBody: t('emptyBody'),
    emptyTitle: t('emptyTitle'),
    favorites: t('favorites'),
    interfaceLanguage: t('interfaceLanguage'),
    language: t('language'),
    library: t('library'),
    localPrivate: t('localPrivate'),
    play: t('play'),
    ready: t('ready'),
    readyToPlay: t('readyToPlay'),
    recent: t('recent'),
    search: t('search'),
    settings: t('settings'),
  };

  const visibleGames = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    return [...games]
      .filter((game) => {
        if (view === 'favorites' && !game.favorite) return false;
        if (view === 'recent' && game.lastPlayedAt === undefined) return false;
        return normalized.length === 0 || game.name.toLocaleLowerCase().includes(normalized);
      })
      .sort((left, right) =>
        view === 'recent'
          ? (right.lastPlayedAt ?? '').localeCompare(left.lastPlayedAt ?? '')
          : left.name.localeCompare(right.name),
      );
  }, [games, query, view]);
  const selectedGame = games.find((game) => game.id === selectedGameId) ?? visibleGames[0];

  const refreshLibrary = async (): Promise<void> => {
    const response = await window.pixelCore.listLibrary();
    if (response.status === 'error') {
      setMessage(response.message);
      setStatus('error');
      uiAudio.play('error');
      return;
    }
    setGames(response.games);
    setSelectedGameId((current) => current ?? response.games[0]?.id);
    setStatus('ready');
  };

  useEffect(() => {
    statusRef.current = status;
  }, [status]);
  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  useEffect(() => {
    uiAudio.setPreferences({ muted: uiAudioMuted, volume: uiAudioVolume });
    localStorage.setItem('pixelcore.uiAudioMuted', String(uiAudioMuted));
    localStorage.setItem('pixelcore.uiAudioVolume', String(uiAudioVolume));
  }, [uiAudioMuted, uiAudioVolume]);

  useEffect(() => {
    const unsubscribeVideo = window.pixelCore.subscribeSessionVideo(setFrame);
    const unsubscribeAudio = window.pixelCore.subscribeSessionAudio((audioFrame) =>
      audio.current.enqueue(audioFrame),
    );
    void refreshLibrary().then(() => uiAudio.play('startup'));
    const handleFocus = (event: FocusEvent): void => {
      if ((event.target as HTMLElement | null)?.matches('button, input, select, summary'))
        uiAudio.play('focus');
    };
    document.addEventListener('focusin', handleFocus);
    return () => {
      document.removeEventListener('focusin', handleFocus);
      unsubscribeAudio();
      unsubscribeVideo();
      audio.current.stop();
    };
  }, []);

  useEffect(() => {
    void window.pixelCore.getInputConfiguration().then((configuration) => {
      const resolvedProfile: InputProfile = configuration.profile ?? {
        deviceFingerprint: 'keyboard:standard',
        id: 'default',
        mapping: configuration.mapping,
        name: 'Default input profile',
        version: 1,
      };
      inputRuntime.current.assignments.prefer(
        resolvedProfile.mapping.playerPortId,
        resolvedProfile.deviceFingerprint,
      );
      setProfile(resolvedProfile);
    });
  }, []);

  useEffect(() => {
    const discovery = new InputDeviceDiscovery({ getGamepads: () => [...navigator.getGamepads()] });
    let animationFrame = 0;
    let previousDevices = '';
    let previousActions = '';
    let previousNavigation = new Set<NormalizedInputAction>();
    const poll = (): void => {
      const discovered = discovery.discover();
      const deviceSignature = discovered
        .map((device) => `${device.id}:${device.fingerprint}`)
        .join('|');
      if (deviceSignature !== previousDevices) {
        previousDevices = deviceSignature;
        setDevices(discovered);
      }
      inputRuntime.current.updateDevices(discovered);
      const currentProfile = profileRef.current;
      if (currentProfile !== undefined) {
        inputRuntime.current.assignments.prefer(
          currentProfile.mapping.playerPortId,
          currentProfile.deviceFingerprint,
        );
        inputRuntime.current.updateDevices(discovered);
        const deviceId = inputRuntime.current.assignments.resolveDeviceId(
          currentProfile.mapping.playerPortId,
        );
        let actions: readonly NormalizedInputAction[] = [];
        if (deviceId === 'keyboard:standard') actions = keyboard.current.readActions();
        else if (deviceId?.startsWith('gamepad:') === true) {
          const descriptor = discovered.find((device) => device.id === deviceId);
          const snapshot =
            descriptor?.index === undefined ? null : navigator.getGamepads()[descriptor.index];
          if (snapshot !== null && snapshot !== undefined)
            actions = gamepad.current.readActions(snapshot);
        }
        if (statusRef.current !== 'running' && statusRef.current !== 'paused') {
          const currentNavigation = new Set(actions);
          for (const [action, direction] of [
            ['move-up', 'up'],
            ['move-down', 'down'],
            ['move-left', 'left'],
            ['move-right', 'right'],
          ] as const) {
            if (
              currentNavigation.has(action) &&
              !previousNavigation.has(action) &&
              moveDirectionalFocus(direction)
            )
              uiAudio.play('focus');
          }
          if (currentNavigation.has('primary') && !previousNavigation.has('primary'))
            (document.activeElement as HTMLElement | null)?.click();
          previousNavigation = currentNavigation;
        }
        const mapped =
          deviceId === undefined
            ? []
            : inputRuntime.current.mapPlayerActions(
                currentProfile.mapping.playerPortId,
                deviceId,
                actions,
                currentProfile.mapping,
              );
        const signature = mapped.join('|');
        if (
          signature !== previousActions &&
          (statusRef.current === 'running' || statusRef.current === 'paused')
        ) {
          previousActions = signature;
          void window.pixelCore.setSessionInput({
            actions: mapped,
            playerPortId: currentProfile.mapping.playerPortId,
          });
        }
      }
      animationFrame = requestAnimationFrame(poll);
    };
    const handleKeyboard = (event: KeyboardEvent, pressed: boolean): void => {
      const target = event.target;
      const editable =
        target instanceof HTMLElement &&
        (target.isContentEditable || ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName));
      if (statusRef.current === 'running' || statusRef.current === 'paused') {
        if (keyboard.current.handle({ code: event.code, editable, pressed }))
          event.preventDefault();
        return;
      }
      if (!pressed || editable) return;
      const direction = {
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
        ArrowUp: 'up',
      }[event.code] as 'down' | 'left' | 'right' | 'up' | undefined;
      if (direction !== undefined && moveDirectionalFocus(direction)) {
        event.preventDefault();
        uiAudio.play('focus');
      }
    };
    const keyDown = (event: KeyboardEvent): void => handleKeyboard(event, true);
    const keyUp = (event: KeyboardEvent): void => handleKeyboard(event, false);
    const resetKeyboard = (): void => keyboard.current.reset();
    window.addEventListener('keydown', keyDown);
    window.addEventListener('keyup', keyUp);
    window.addEventListener('blur', resetKeyboard);
    animationFrame = requestAnimationFrame(poll);
    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('keydown', keyDown);
      window.removeEventListener('keyup', keyUp);
      window.removeEventListener('blur', resetKeyboard);
    };
  }, []);

  const persistProfile = (nextProfile: InputProfile): void => {
    setProfile(nextProfile);
    profileRef.current = nextProfile;
    inputRuntime.current.assignments.prefer(
      nextProfile.mapping.playerPortId,
      nextProfile.deviceFingerprint,
    );
    void window.pixelCore.saveInputProfile(nextProfile);
  };
  const changeMapping = (normalizedAction: string, consoleAction: string): void => {
    if (profile === undefined) return;
    const current = profile.mapping.entries.find(
      (entry) => entry.normalizedAction === normalizedAction,
    );
    if (current === undefined || current.consoleAction === consoleAction) return;
    const mapping: ConsoleInputMapping = {
      ...profile.mapping,
      entries: profile.mapping.entries.map((entry) => {
        if (entry.normalizedAction === normalizedAction) return { ...entry, consoleAction };
        if (entry.consoleAction === consoleAction)
          return { ...entry, consoleAction: current.consoleAction };
        return entry;
      }),
    };
    persistProfile({ ...profile, mapping });
    uiAudio.play('toggle-on');
  };

  const importGame = async (): Promise<void> => {
    uiAudio.play('open');
    const response = await window.pixelCore.importGame();
    if (response.status === 'cancelled') return;
    if (response.status === 'error') {
      setMessage(response.message);
      setStatus('error');
      uiAudio.play('error');
      return;
    }
    await refreshLibrary();
    setSelectedGameId(response.game.id);
    uiAudio.play('success');
  };
  const launchGame = async (game: LibraryGame): Promise<void> => {
    await audio.current.start();
    setSelectedGameId(game.id);
    setStatus('starting');
    setMessage(`${t('loading')} ${game.name}`);
    uiAudio.play('launch');
    const result = await window.pixelCore.startLibraryGame(game.id);
    if (result.status === 'error') {
      setStatus('error');
      setMessage(result.message);
      uiAudio.play('error');
      return;
    }
    setStatus('running');
    setMessage(game.name);
    await refreshLibrary();
    setStatus('running');
  };
  const runAction = async (action: 'pause' | 'resume' | 'stop'): Promise<void> => {
    const result = await window.pixelCore[`${action}Session`]();
    if (result.status === 'error') {
      setStatus('error');
      setMessage(result.message);
      uiAudio.play('error');
      return;
    }
    const next = result.sessionStatus as ProductStatus;
    setStatus(next);
    uiAudio.play(action === 'stop' ? 'back' : action);
    if (action === 'stop') {
      setFrame(undefined);
      setView('library');
    }
  };
  const toggleFavorite = async (game: LibraryGame): Promise<void> => {
    const response = await window.pixelCore.updateFavorite(game.id, !game.favorite);
    if (response.status !== 'updated') {
      if (response.status === 'error') setMessage(response.message);
      return;
    }
    setGames((current) =>
      current.map((candidate) => (candidate.id === game.id ? response.game : candidate)),
    );
    uiAudio.play(response.game.favorite ? 'favorite-add' : 'favorite-remove');
  };
  const selectArtwork = async (game: LibraryGame): Promise<void> => {
    const response = await window.pixelCore.selectGameArtwork(game.id);
    if (response.status === 'updated') {
      setGames((current) =>
        current.map((candidate) => (candidate.id === game.id ? response.game : candidate)),
      );
      uiAudio.play('success');
    } else if (response.status === 'error') {
      setMessage(response.message);
      uiAudio.play('error');
    }
  };

  if (status === 'running' || status === 'paused' || status === 'starting') {
    return (
      <main className="pc-session-view">
        <ParticleField />
        <header className="pc-session-header">
          <button className="pc-ghost-button" onClick={() => void runAction('stop')} type="button">
            <Icon name="archive" /> {t('backLibrary')}
          </button>
          <span className={`pc-status pc-status-${status}`}>
            <i />{' '}
            {t(
              status === 'paused'
                ? 'statusPaused'
                : status === 'starting'
                  ? 'statusStarting'
                  : 'statusRunning',
            )}
          </span>
        </header>
        <section className="pc-session-stage">
          <div className="pc-session-screen">
            <EmulatorVideoCanvas {...(frame === undefined ? {} : { frame })} label={message} />
          </div>
          <aside className="pc-session-panel">
            <p className="pc-eyebrow">{t('nowPlaying')}</p>
            <h1>{selectedGame?.name ?? message}</h1>
            <p>{message}</p>
            <div className="pc-session-actions">
              {status === 'paused' ? (
                <button
                  className="pc-primary-button"
                  onClick={() => void runAction('resume')}
                  type="button"
                >
                  <Icon name="gamepad" /> {t('resume')}
                </button>
              ) : (
                <button
                  className="pc-primary-button"
                  disabled={status !== 'running'}
                  onClick={() => void runAction('pause')}
                  type="button"
                >
                  {t('pause')}
                </button>
              )}
              <button
                className="pc-ghost-button"
                onClick={() => void runAction('stop')}
                type="button"
              >
                {t('stop')}
              </button>
            </div>
            <div className="pc-control-hint">
              <span>↑ ↓ ← →</span>
              <span>Z / X</span>
              <span>Enter</span>
            </div>
          </aside>
        </section>
      </main>
    );
  }

  if (status === 'loading')
    return (
      <main className="pc-state-page">
        <span className="pc-loader" />
        <p>{t('loading')}</p>
      </main>
    );
  return (
    <>
      <LibraryShell
        artworkFor={(game) => game.artworkDataUrl ?? defaultArtworkUrl}
        copy={copy}
        games={visibleGames}
        locale={i18n.language}
        logoUrl={logoUrl}
        onAddGame={() => void importGame()}
        onArtwork={(game) => void selectArtwork(game as LibraryGame)}
        onFavorite={(game) => void toggleFavorite(game as LibraryGame)}
        onLocaleChange={(locale) => void setLocale(locale as SupportedLocale)}
        onPlay={(game) => void launchGame(game as LibraryGame)}
        onQueryChange={setQuery}
        onViewChange={(nextView) => {
          setView(nextView);
          setQuery('');
          uiAudio.play('select');
        }}
        query={query}
        {...(selectedGame === undefined ? {} : { selectedGame })}
        view={view}
      >
        <section className="pc-setting-card">
          <p className="pc-eyebrow">{t('interfaceAudio')}</p>
          <h2>{t('feedbackSounds')}</h2>
          <label className="pc-toggle-row">
            <span>{t('muteUiSounds')}</span>
            <input
              checked={uiAudioMuted}
              onChange={(event) => {
                setUiAudioMuted(event.target.checked);
                uiAudio.play(event.target.checked ? 'toggle-off' : 'toggle-on');
              }}
              type="checkbox"
            />
          </label>
          <label className="pc-volume-row">
            <span>{t('volume')}</span>
            <input
              aria-label={t('volume')}
              max="1"
              min="0"
              onChange={(event) => setUiAudioVolume(Number(event.target.value))}
              step="0.05"
              type="range"
              value={uiAudioVolume}
            />
          </label>
        </section>
        {profile === undefined ? null : (
          <InputMappingSettings
            copy={{
              consoleAction: t('consoleAction'),
              disconnected: t('disconnected'),
              gameControls: t('gameControls'),
              inputSettings: t('inputSettings'),
              playerOneDevice: t('playerOneDevice'),
            }}
            devices={devices}
            entries={profile.mapping.entries}
            onDeviceChange={(deviceFingerprint) =>
              persistProfile({ ...profile, deviceFingerprint })
            }
            onMappingChange={changeMapping}
            selectedDeviceFingerprint={profile.deviceFingerprint}
          />
        )}
      </LibraryShell>
      {status === 'error' ? (
        <aside className="pc-toast" role="alert">
          <div>
            <strong>{t('errorTitle')}</strong>
            <span>{message}</span>
          </div>
          <button onClick={() => void refreshLibrary()} type="button">
            {t('tryAgain')}
          </button>
        </aside>
      ) : null}
    </>
  );
};

const root = document.getElementById('root');
if (root === null) throw new Error('PixelCore renderer root is missing.');
createRoot(root).render(<App />);
