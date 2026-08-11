import { createRoot } from 'react-dom/client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  GamepadInputAdapter,
  PLATFORM_GAMEPAD_BINDINGS,
  bindingsForGamepad,
  readPressedGamepadButtons,
  GamepadPromptActivityTracker,
  DEFAULT_KEYBOARD_BINDINGS,
  InputDeviceDiscovery,
  KeyboardInputAdapter,
  isCapturableKeyboardInput,
  UniversalInputRuntime,
  classifyGamepadPromptScheme,
  type ConsoleInputMapping,
  type InputDeviceDescriptor,
  type InputProfile,
  type NormalizedInputAction,
  type InputPromptScheme,
} from '@platform/input';
import {
  EmulatorAudioPlayer,
  EmulatorVideoCanvas,
  ConsoleCarousel,
  ConsoleLibrary,
  GlobalSettingsMenu,
  Icon,
  InputPrompt,
  InputPromptGroup,
  InputPromptProvider,
  InputMappingSettings,
  moveDirectionalFocus,
  ParticleField,
  type ConsoleCarouselHandle,
  type ConsoleLibraryHandle,
  type GlobalSettingsMenuHandle,
  type InputMappingSettingsHandle,
} from '@platform/ui';
import { BrowserUiAudioService } from '@platform/ui-audio';
import type { LibraryGame, PixelCoreApi, SessionVideoFrame } from './ipc.js';
import { setLocale, type SupportedLocale } from './localization.js';
import { buildConsoleCatalog } from './console-catalog.js';
import './renderer.css';
import { kenneyInputPromptAssets } from './input-prompt-assets.js';
import {
  clearLegacyGlobalPreferences,
  createDefaultGlobalPreferences,
  readLegacyGlobalPreferences,
  type GlobalPreferenceLocale,
  type GlobalPreferences,
} from './global-preferences.js';

declare global {
  interface Window {
    readonly pixelCore: PixelCoreApi;
  }
}

const logoUrl = new URL('../assets/brand/pixelcore-logo.png', import.meta.url).href;
const iconUrl = new URL('../assets/brand/pixelcore-icon.png', import.meta.url).href;
const defaultArtworkUrl = new URL('../assets/library/default-game-cover.png', import.meta.url).href;
const cartridgeUrl = new URL('../assets/library/portable-cartridge.webp', import.meta.url).href;
const gameBoyBlueprintUrl = new URL(
  '../assets/consoles/game-boy-family-outline.png',
  import.meta.url,
).href;
const gameBoyControlDiagram = {
  alt: 'Game Boy Family control blueprint',
  assetUrl: gameBoyBlueprintUrl,
  controlPoints: [
    { action: 'up', x: 32, y: 53 },
    { action: 'down', x: 32, y: 67 },
    { action: 'left', x: 22, y: 60 },
    { action: 'right', x: 42, y: 60 },
    { action: 'a', x: 73, y: 57.5 },
    { action: 'b', x: 62, y: 62.5 },
    { action: 'start', x: 54, y: 73.3 },
    { action: 'select', x: 41, y: 73.3 },
  ],
} as const;
const consoleArtwork = {
  'game-boy-family': new URL('../assets/consoles/game-boy-family.webp', import.meta.url).href,
  'n64-era': new URL('../assets/consoles/n64-era.webp', import.meta.url).href,
  'nes-era': new URL('../assets/consoles/nes-era.webp', import.meta.url).href,
  'snes-era': new URL('../assets/consoles/snes-era.webp', import.meta.url).href,
} as const;
const soundUrl = (name: string): string =>
  new URL(`../assets/audio/${name}.wav`, import.meta.url).href;
const uiAudio = new BrowserUiAudioService({
  back: soundUrl('close'),
  browse: soundUrl('browse'),
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
const defaultGlobalPreferences = createDefaultGlobalPreferences(navigator.language);

type ProductStatus = 'error' | 'loading' | 'paused' | 'ready' | 'running' | 'starting' | 'stopped';
type AppScreen = 'home' | 'library';

const App = (): React.JSX.Element => {
  const { t } = useTranslation();
  const [frame, setFrame] = useState<SessionVideoFrame>();
  const [message, setMessage] = useState(t('sessionReady'));
  const [status, setStatus] = useState<ProductStatus>('loading');
  const [startupVisible, setStartupVisible] = useState(true);
  const [screen, setScreen] = useState<AppScreen>('home');
  const [globalSettingsOpen, setGlobalSettingsOpen] = useState(false);
  const [inputPromptScheme, setInputPromptScheme] = useState<InputPromptScheme>('desktop');
  const [availableConsoleIds, setAvailableConsoleIds] = useState<readonly string[]>([]);
  const [games, setGames] = useState<readonly LibraryGame[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string>();
  const [preferenceLocale, setPreferenceLocale] = useState<GlobalPreferenceLocale>(
    defaultGlobalPreferences.locale,
  );
  const [uiAudioMuted, setUiAudioMuted] = useState(defaultGlobalPreferences.uiAudioMuted);
  const [uiAudioVolume, setUiAudioVolume] = useState(defaultGlobalPreferences.uiAudioVolume);
  const [globalPreferencesReady, setGlobalPreferencesReady] = useState(false);
  const [globalPreferencesWarning, setGlobalPreferencesWarning] = useState(false);
  const audio = useRef(new EmulatorAudioPlayer());
  const keyboard = useRef(new KeyboardInputAdapter());
  const platformKeyboard = useRef(new KeyboardInputAdapter());
  const gamepad = useRef(new GamepadInputAdapter());
  const gamepadPromptActivity = useRef(new GamepadPromptActivityTracker());
  const inputRuntime = useRef(new UniversalInputRuntime());
  const [devices, setDevices] = useState<readonly InputDeviceDescriptor[]>([]);
  const [profile, setProfile] = useState<InputProfile>();
  const profileRef = useRef<InputProfile | undefined>(undefined);
  const statusRef = useRef<ProductStatus>(status);
  const screenRef = useRef<AppScreen>(screen);
  const globalSettingsOpenRef = useRef(false);
  const carousel = useRef<ConsoleCarouselHandle>(null);
  const consoleLibrary = useRef<ConsoleLibraryHandle>(null);
  const globalSettings = useRef<GlobalSettingsMenuHandle>(null);
  const inputMappingSettings = useRef<InputMappingSettingsHandle>(null);
  const skipGlobalPreferencesSave = useRef(true);

  const consoles = useMemo(
    () =>
      buildConsoleCatalog(
        availableConsoleIds,
        (key) => t(key),
        (key) => consoleArtwork[key],
      ),
    [availableConsoleIds, t],
  );

  const selectedGame = games.find((game) => game.id === selectedGameId) ?? games[0];

  const setGlobalSettings = (open: boolean): void => {
    globalSettingsOpenRef.current = open;
    setGlobalSettingsOpen(open);
    uiAudio.play(open ? 'open' : 'back');
    window.requestAnimationFrame(() => {
      if (open) globalSettings.current?.focus();
      else carousel.current?.focus();
    });
  };

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
    screenRef.current = screen;
  }, [screen]);
  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  useEffect(() => {
    let pointerX: number | undefined;
    let pointerY: number | undefined;
    const useDesktopPrompts = (): void => setInputPromptScheme('desktop');
    const handlePointerMove = (event: PointerEvent): void => {
      if (
        pointerX === undefined ||
        pointerY === undefined ||
        Math.hypot(event.clientX - pointerX, event.clientY - pointerY) >= 4
      )
        useDesktopPrompts();
      pointerX = event.clientX;
      pointerY = event.clientY;
    };
    window.addEventListener('pointerdown', useDesktopPrompts);
    window.addEventListener('pointermove', handlePointerMove);
    return () => {
      window.removeEventListener('pointerdown', useDesktopPrompts);
      window.removeEventListener('pointermove', handlePointerMove);
    };
  }, []);

  useEffect(() => {
    uiAudio.setPreferences({ muted: uiAudioMuted, volume: uiAudioVolume });
    if (!globalPreferencesReady) return;
    if (skipGlobalPreferencesSave.current) {
      skipGlobalPreferencesSave.current = false;
      return;
    }
    const preferences: GlobalPreferences = {
      locale: preferenceLocale,
      uiAudioMuted,
      uiAudioVolume,
      version: 1,
    };
    void window.pixelCore.saveGlobalPreferences(preferences).then((response) => {
      if (response.status === 'error') {
        console.warn(
          JSON.stringify({ code: 'global-preferences-save-failed', message: response.message }),
        );
        setGlobalPreferencesWarning(true);
      } else setGlobalPreferencesWarning(false);
    });
  }, [globalPreferencesReady, preferenceLocale, uiAudioMuted, uiAudioVolume]);

  useEffect(() => {
    void window.pixelCore
      .getGlobalPreferences()
      .then(async (response) => {
        let preferences: GlobalPreferences;
        if (response.status === 'ready' && response.preferences !== undefined) {
          preferences = response.preferences;
        } else {
          const legacy = readLegacyGlobalPreferences(localStorage, navigator.language);
          preferences = legacy.preferences;
          if (response.status === 'error') {
            console.warn(
              JSON.stringify({ code: 'global-preferences-load-failed', message: response.message }),
            );
            setGlobalPreferencesWarning(true);
          } else {
            const saved = await window.pixelCore.saveGlobalPreferences(preferences);
            if (saved.status === 'saved') clearLegacyGlobalPreferences(localStorage, legacy.keys);
            else {
              console.warn(
                JSON.stringify({
                  code: 'global-preferences-migration-failed',
                  message: saved.message,
                }),
              );
              setGlobalPreferencesWarning(true);
            }
          }
        }
        setPreferenceLocale(preferences.locale);
        setUiAudioMuted(preferences.uiAudioMuted);
        setUiAudioVolume(preferences.uiAudioVolume);
        uiAudio.setPreferences({
          muted: preferences.uiAudioMuted,
          volume: preferences.uiAudioVolume,
        });
        await setLocale(preferences.locale as SupportedLocale);
      })
      .catch((error: unknown) => {
        console.warn(
          JSON.stringify({
            code: 'global-preferences-load-failed',
            message: error instanceof Error ? error.message : 'Unknown preference error.',
          }),
        );
        setGlobalPreferencesWarning(true);
      })
      .finally(() => setGlobalPreferencesReady(true));
  }, []);

  useEffect(() => {
    if (!globalPreferencesReady) return;
    const unsubscribeVideo = window.pixelCore.subscribeSessionVideo(setFrame);
    const unsubscribeAudio = window.pixelCore.subscribeSessionAudio((audioFrame) =>
      audio.current.enqueue(audioFrame),
    );
    void uiAudio.play('startup');
    void refreshLibrary();
    void window.pixelCore
      .listConsolePlugins()
      .then((response) => setAvailableConsoleIds(response.ids));
    const startupTimer = window.setTimeout(
      () => setStartupVisible(false),
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 450 : 2200,
    );
    const handleFocus = (event: FocusEvent): void => {
      const target = event.target as HTMLElement | null;
      if (
        target?.matches('button, input, select, summary') === true &&
        target.closest('.pc-console-home') === null
      )
        uiAudio.play('focus');
    };
    document.addEventListener('focusin', handleFocus);
    return () => {
      document.removeEventListener('focusin', handleFocus);
      window.clearTimeout(startupTimer);
      unsubscribeAudio();
      unsubscribeVideo();
      audio.current.stop();
    };
  }, [globalPreferencesReady]);

  useEffect(() => {
    void window.pixelCore.getInputConfiguration().then((configuration) => {
      const resolvedProfile: InputProfile = configuration.profile ?? {
        gamepadBindings: [],
        deviceFingerprint: 'keyboard:standard',
        id: 'default',
        keyboardBindings: DEFAULT_KEYBOARD_BINDINGS,
        mapping: configuration.mapping,
        name: 'Default input profile',
        version: 3,
      };
      inputRuntime.current.assignments.prefer(
        resolvedProfile.mapping.playerPortId,
        resolvedProfile.deviceFingerprint,
      );
      profileRef.current = resolvedProfile;
      keyboard.current.setBindings(resolvedProfile.keyboardBindings);
      setProfile(resolvedProfile);
    });
  }, []);

  useEffect(() => {
    const discovery = new InputDeviceDiscovery({ getGamepads: () => [...navigator.getGamepads()] });
    let animationFrame = 0;
    let previousDevices = '';
    let previousActions = '';
    let previousNavigation = new Set<NormalizedInputAction>();
    let previousCapture = new Set<number>();
    let previousCaptureDevice = '';
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
      const promptGamepad = gamepadPromptActivity.current.detect([...navigator.getGamepads()]);
      if (promptGamepad !== undefined)
        setInputPromptScheme(classifyGamepadPromptScheme(promptGamepad.id));
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
        const assignedDescriptor = discovered.find(
          (device) =>
            device.kind === 'gamepad' &&
            device.fingerprint === currentProfile.deviceFingerprint,
        );
        const selectedSnapshot =
          assignedDescriptor?.index === undefined
            ? null
            : navigator.getGamepads()[assignedDescriptor.index];
        let assignedGamepad: Gamepad | undefined = selectedSnapshot ?? undefined;
        if (deviceId === 'keyboard:standard') actions = keyboard.current.readActions();
        else if (deviceId?.startsWith('gamepad:') === true) {
          const snapshot = selectedSnapshot;
          if (snapshot !== null && snapshot !== undefined) {
            assignedGamepad = snapshot;
            actions = gamepad.current.readActions(
              snapshot,
              bindingsForGamepad(currentProfile, currentProfile.deviceFingerprint),
            );
          }
        }
        if (statusRef.current !== 'running' && statusRef.current !== 'paused') {
          const navigationActions = new Set<NormalizedInputAction>(
            platformKeyboard.current.readActions(),
          );
          for (const snapshot of navigator.getGamepads()) {
            if (snapshot === null || !snapshot.connected) continue;
            for (const action of gamepad.current.readActions(snapshot, PLATFORM_GAMEPAD_BINDINGS))
              navigationActions.add(action);
          }
          const currentNavigation = navigationActions;
          if (previousCaptureDevice !== currentProfile.deviceFingerprint) {
            previousCaptureDevice = currentProfile.deviceFingerprint;
            previousCapture = new Set();
          }
          const currentCapture = new Set(
            assignedGamepad === undefined ? [] : readPressedGamepadButtons(assignedGamepad),
          );
          const inputEdges = [...currentCapture].filter(
            (action) => !previousCapture.has(action),
          );
          const inputConsumed =
            screenRef.current === 'library' &&
            inputEdges.some(
              (index) => inputMappingSettings.current?.captureGamepadInput(index) === true,
            );
          previousCapture = currentCapture;
          if (!inputConsumed) {
            for (const [action, direction] of [
              ['move-up', 'up'],
              ['move-down', 'down'],
              ['move-left', 'left'],
              ['move-right', 'right'],
            ] as const) {
              if (currentNavigation.has(action) && !previousNavigation.has(action)) {
                if (screenRef.current === 'home' && globalSettingsOpenRef.current)
                  globalSettings.current?.move(direction);
                else if (
                  screenRef.current === 'home' &&
                  (direction === 'left' || direction === 'right')
                )
                  carousel.current?.move(direction);
                else if (screenRef.current === 'library') consoleLibrary.current?.move(direction);
                else if (screenRef.current !== 'home' && moveDirectionalFocus(direction))
                  uiAudio.play('focus');
              }
            }
            if (currentNavigation.has('primary') && !previousNavigation.has('primary')) {
              if (screenRef.current === 'home' && globalSettingsOpenRef.current)
                globalSettings.current?.confirm();
              else if (screenRef.current === 'home') carousel.current?.confirm();
              else if (screenRef.current === 'library') consoleLibrary.current?.confirm();
              else (document.activeElement as HTMLElement | null)?.click();
            }
            if (
              screenRef.current === 'home' &&
              currentNavigation.has('start') &&
              !previousNavigation.has('start')
            )
              setGlobalSettings(!globalSettingsOpenRef.current);
            if (
              screenRef.current === 'home' &&
              globalSettingsOpenRef.current &&
              currentNavigation.has('secondary') &&
              !previousNavigation.has('secondary')
            )
              setGlobalSettings(false);
            if (
              screenRef.current === 'library' &&
              currentNavigation.has('secondary') &&
              !previousNavigation.has('secondary')
            )
              consoleLibrary.current?.back();
          }
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
      if (pressed) setInputPromptScheme('desktop');
      const target = event.target;
      const editable =
        target instanceof HTMLElement &&
        (target.isContentEditable || ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName));
      if (
        pressed &&
        !editable &&
        isCapturableKeyboardInput({
          altKey: event.altKey,
          code: event.code,
          ctrlKey: event.ctrlKey,
          metaKey: event.metaKey,
          repeat: event.repeat,
        }) &&
        profileRef.current?.deviceFingerprint === 'keyboard:standard' &&
        screenRef.current === 'library' &&
        inputMappingSettings.current?.captureKeyboard(
          event.code,
          event.key.length === 1 ? event.key.toUpperCase() : event.key,
        ) === true
      ) {
        event.preventDefault();
        return;
      }
      const keyboardHandled = keyboard.current.handle({ code: event.code, editable, pressed });
      platformKeyboard.current.handle({ code: event.code, editable, pressed });
      if (statusRef.current === 'running' || statusRef.current === 'paused') {
        if (keyboardHandled) event.preventDefault();
        return;
      }
      if (!pressed || editable) return;
      if (screenRef.current === 'home') {
        if (event.code === 'Escape') {
          event.preventDefault();
          setGlobalSettings(!globalSettingsOpenRef.current);
        }
        return;
      }
      if (screenRef.current === 'library') {
        if (event.code === 'Escape' || event.code === 'Backspace') {
          event.preventDefault();
          consoleLibrary.current?.back();
        }
        return;
      }
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
    const resetKeyboard = (): void => {
      keyboard.current.reset();
      platformKeyboard.current.reset();
    };
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
    keyboard.current.setBindings(nextProfile.keyboardBindings);
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
  const changeKeyboardBinding = (normalizedAction: string, code: string): void => {
    if (profile === undefined) return;
    const current = profile.keyboardBindings.find(
      (binding) => binding.normalizedAction === normalizedAction,
    );
    if (current === undefined || current.code === code) return;
    const conflict = profile.keyboardBindings.find((binding) => binding.code === code);
    persistProfile({
      ...profile,
      keyboardBindings: profile.keyboardBindings.map((binding) => {
        if (binding.normalizedAction === normalizedAction) return { ...binding, code };
        if (binding.normalizedAction === conflict?.normalizedAction)
          return { ...binding, code: current.code };
        return binding;
      }),
    });
    uiAudio.play('toggle-on');
  };
  const changeGamepadBinding = (normalizedAction: string, index: number): void => {
    if (profile === undefined || profile.deviceFingerprint === 'keyboard:standard') return;
    const deviceFingerprint = profile.deviceFingerprint;
    const bindings = bindingsForGamepad(profile, deviceFingerprint);
    const current = bindings.find((binding) => binding.normalizedAction === normalizedAction);
    if (current === undefined || current.index === index) return;
    const conflict = bindings.find((binding) => binding.index === index);
    const nextBindings = bindings.map((binding) => {
      if (binding.normalizedAction === normalizedAction) return { ...binding, index };
      if (binding.normalizedAction === conflict?.normalizedAction)
        return { ...binding, index: current.index };
      return binding;
    });
    persistProfile({
      ...profile,
      gamepadBindings: [
        ...profile.gamepadBindings.filter((set) => set.deviceFingerprint !== deviceFingerprint),
        { bindings: nextBindings, deviceFingerprint },
      ],
    });
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

  if (startupVisible) {
    return (
      <main className="pc-startup" aria-label="PixelCore">
        <div className="pc-startup-atmosphere" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <div className="pc-startup-particles" aria-hidden="true">
          {Array.from({ length: 16 }, (_, index) => (
            <i key={index} />
          ))}
        </div>
        <section className="pc-startup-mark" aria-live="polite">
          <div className="pc-startup-core">
            <span className="pc-startup-orbit pc-startup-orbit-one" />
            <span className="pc-startup-orbit pc-startup-orbit-two" />
            <span className="pc-startup-orbit pc-startup-orbit-three" />
            <img alt="" className="pc-startup-icon" src={iconUrl} />
          </div>
          <img alt="PixelCore" className="pc-startup-logo" src={logoUrl} />
          <div className="pc-startup-signal" aria-hidden="true">
            <span />
          </div>
          <p>Play. Preserve. Connect.</p>
        </section>
      </main>
    );
  }

  if (status === 'running' || status === 'paused' || status === 'starting') {
    return (
      <InputPromptProvider assetMap={kenneyInputPromptAssets} scheme={inputPromptScheme}>
        <main className="pc-session-view">
          <ParticleField />
          <header className="pc-session-header">
            <button
              className="pc-ghost-button"
              onClick={() => void runAction('stop')}
              type="button"
            >
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
                <span>
                  <InputPrompt action="navigate-all" label={t('settingsMoveHint')} />
                </span>
                <span>
                  <InputPromptGroup actions={['primary', 'secondary']} label={t('gameControls')} />
                </span>
                <span>
                  <InputPromptGroup actions={['start', 'select']} label={t('gameControls')} />
                </span>
              </div>
            </aside>
          </section>
        </main>
      </InputPromptProvider>
    );
  }

  if (screen === 'home')
    return (
      <InputPromptProvider assetMap={kenneyInputPromptAssets} scheme={inputPromptScheme}>
        <>
          <ConsoleCarousel
            copy={{
              available: t('available'),
              chooseSystem: t('chooseSystem'),
              comingSoon: t('comingSoon'),
              confirm: t('confirmSystem'),
              formats: t('formats'),
              next: t('nextSystem'),
              position: (current, total) => t('systemPosition', { current, total }),
              previous: t('previousSystem'),
              unavailable: (name) => t('unavailableSystem', { name }),
            }}
            items={consoles}
            logoUrl={logoUrl}
            onConfirm={(item) => {
              if (item.availability === 'coming-soon') {
                uiAudio.play('warning');
                return;
              }
              uiAudio.play('select');
              setGlobalSettingsOpen(false);
              setScreen('library');
            }}
            onFocusSound={() => uiAudio.play('browse')}
            ref={carousel}
          />
          <button
            aria-label={t('globalSettings')}
            className="pc-global-settings-button"
            onClick={() => {
              setGlobalSettings(!globalSettingsOpenRef.current);
            }}
            type="button"
          >
            <span className="pc-global-settings-icon">
              <Icon name="settings" />
            </span>
            <span className="pc-global-settings-copy">
              <strong>{t('globalSettings')}</strong>
              <small>
                <InputPrompt action="settings" label={t('globalSettings')} />
              </small>
            </span>
          </button>
          {globalSettingsOpen ? (
            <GlobalSettingsMenu
              copy={{
                adjustHint: t('settingsAdjustHint'),
                close: t('close'),
                closeHint: t('settingsCloseHint'),
                confirmHint: t('settingsConfirmHint'),
                language: t('interfaceLanguage'),
                muted: t('muted'),
                moveHint: t('settingsMoveHint'),
                sounds: t('feedbackSounds'),
                soundsOn: t('soundsOn'),
                title: t('globalSettings'),
                volume: t('volume'),
              }}
              locale={preferenceLocale}
              locales={[
                { label: 'English', value: 'en-US' },
                { label: 'Português (Brasil)', value: 'pt-BR' },
                { label: '简体中文', value: 'zh-CN' },
              ]}
              muted={uiAudioMuted}
              onAdjust={() => uiAudio.play('adjust')}
              onClose={() => setGlobalSettings(false)}
              onLocaleChange={(locale) => {
                const supportedLocale = locale as GlobalPreferenceLocale;
                setPreferenceLocale(supportedLocale);
                void setLocale(supportedLocale as SupportedLocale);
              }}
              onMutedChange={setUiAudioMuted}
              onNavigate={() => uiAudio.play('focus')}
              onVolumeChange={setUiAudioVolume}
              ref={globalSettings}
              volume={uiAudioVolume}
            />
          ) : null}
          {globalPreferencesWarning ? (
            <aside className="pc-toast" role="status">
              <div>
                <strong>{t('preferencesWarningTitle')}</strong>
                <span>{t('preferencesWarningMessage')}</span>
              </div>
            </aside>
          ) : null}
        </>
      </InputPromptProvider>
    );

  if (status === 'loading')
    return (
      <main className="pc-state-page">
        <span className="pc-loader" />
        <p>{t('loading')}</p>
      </main>
    );
  return (
    <InputPromptProvider assetMap={kenneyInputPromptAssets} scheme={inputPromptScheme}>
      <>
        {consoles[0] === undefined ? null : (
          <ConsoleLibrary
            artworkFor={(game) => game.artworkDataUrl ?? defaultArtworkUrl}
            cartridgeUrl={cartridgeUrl}
            console={consoles[0]}
            copy={{
              addGame: t('addGame'),
              artwork: t('artwork'),
              backSystems: t('backSystems'),
              emptyCategory: t('emptyCategory'),
              favorite: t('favoriteGame'),
              favorites: t('favorites'),
              library: t('library'),
              playHint: t('playHint'),
              recent: t('recent'),
              removeFavorite: t('removeFavorite'),
              settings: t('settings'),
            }}
            games={games.filter((game) => consoles[0]?.extensions.includes(game.extension))}
            logoUrl={logoUrl}
            onAddGame={() => void importGame()}
            onArtwork={(game) => void selectArtwork(game as LibraryGame)}
            onBack={() => {
              setScreen('home');
              uiAudio.play('back');
            }}
            onBackFeedback={() => uiAudio.play('back')}
            onCategoryChange={() => uiAudio.play('focus')}
            onDetail={() => uiAudio.play('select')}
            onFavorite={(game) => void toggleFavorite(game as LibraryGame)}
            onPlay={(game) => void launchGame(game as LibraryGame)}
            onSelect={(game) => setSelectedGameId(game.id)}
            onSelectionChange={() => uiAudio.play('browse')}
            ref={consoleLibrary}
            settingsRef={inputMappingSettings}
          >
            {profile === undefined ? null : (
              <InputMappingSettings
                assetMap={kenneyInputPromptAssets}
                copy={{
                  assigned: t('mappingAssigned'),
                  chooseDevice: t('mappingChooseDevice'),
                  connected: t('connected'),
                  consoleAction: t('consoleAction'),
                  disconnected: t('disconnected'),
                  editButton: t('mappingEditButton'),
                  gameControls: t('gameControls'),
                  inputSettings: t('inputSettings'),
                  mappingCancelled: t('mappingCancelled'),
                  mappingCancel: t('mappingCancel'),
                  mappingConfirm: t('mappingConfirm'),
                  mappingPreview: t('mappingPreview'),
                  mappingSaved: t('mappingSaved'),
                  playerOneDevice: t('playerOneDevice'),
                  pressInput: t('mappingPressInput'),
                }}
                devices={devices}
                diagram={gameBoyControlDiagram}
                entries={profile.mapping.entries}
                keyboardBindings={profile.keyboardBindings}
                onBackFeedback={() => uiAudio.play('back')}
                onConfirmFeedback={() => uiAudio.play('toggle-on')}
                onDeviceChange={(deviceFingerprint) =>
                  persistProfile({ ...profile, deviceFingerprint })
                }
                onEditFeedback={() => uiAudio.play('select')}
                onMappingChange={changeMapping}
                onKeyboardBindingChange={changeKeyboardBinding}
                onGamepadBindingChange={changeGamepadBinding}
                onNavigate={() => uiAudio.play('focus')}
                promptScheme={
                  profile.deviceFingerprint === 'keyboard:standard'
                    ? 'desktop'
                    : classifyGamepadPromptScheme(
                        devices.find((device) => device.fingerprint === profile.deviceFingerprint)
                          ?.label ?? '',
                      )
                }
                ref={inputMappingSettings}
                selectedDeviceFingerprint={profile.deviceFingerprint}
                selectedDeviceKind={
                  profile.deviceFingerprint === 'keyboard:standard' ? 'keyboard' : 'gamepad'
                }
              />
            )}
          </ConsoleLibrary>
        )}
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
    </InputPromptProvider>
  );
};

const root = document.getElementById('root');
if (root === null) throw new Error('PixelCore renderer root is missing.');
createRoot(root).render(<App />);
