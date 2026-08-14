import { createRoot } from 'react-dom/client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  GamepadInputAdapter,
  PLATFORM_GAMEPAD_BINDINGS,
  DEFAULT_ADVANCED_KEYBOARD_BINDINGS,
  advancedBindingsForGamepad,
  bindingsForGamepad,
  gamepadButtonForAdvancedCommand,
  keyboardCodeForAdvancedCommand,
  rebindAdvancedGamepad,
  rebindAdvancedKeyboard,
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
  type AdvancedInputCommand,
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
  type ConsoleCarouselHandle,
  type ConsoleLibraryHandle,
  type EmulatorAmbientPalette,
  type GlobalSettingsMenuHandle,
  type InputMappingSettingsHandle,
} from '@platform/ui';
import { BrowserUiAudioService } from '@platform/ui-audio';
import type {
  LibraryGame,
  LibraryLaunchMode,
  PixelCoreApi,
  ConsolePluginAssetEntry,
  SessionVideoFrame,
  UpdateState,
} from './ipc.js';
import type { SaveStateDescriptor, SaveStateSlot } from '@platform/emulator';
import type { EmulatorCapabilities } from '@platform/emulator-sdk';
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
const soundUrl = (name: string): string =>
  new URL(`../assets/audio/${name}.wav`, import.meta.url).href;
const uiAudio = new BrowserUiAudioService({
  adjust: soundUrl('adjust'),
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

interface PixelCoreBatteryManager extends EventTarget {
  readonly charging: boolean;
  readonly level: number;
}

const SystemStatus = (): React.JSX.Element => {
  const [now, setNow] = useState(() => new Date());
  const [battery, setBattery] = useState<{ charging: boolean; level: number }>();
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    const navigatorWithBattery = navigator as Navigator & {
      getBattery?: () => Promise<PixelCoreBatteryManager>;
    };
    let manager: PixelCoreBatteryManager | undefined;
    const updateBattery = (): void => {
      if (manager === undefined) return;
      setBattery({ charging: manager.charging, level: Math.round(manager.level * 100) });
    };
    void navigatorWithBattery.getBattery?.().then((resolved) => {
      manager = resolved;
      updateBattery();
      manager.addEventListener('chargingchange', updateBattery);
      manager.addEventListener('levelchange', updateBattery);
    });
    return () => {
      window.clearInterval(timer);
      manager?.removeEventListener('chargingchange', updateBattery);
      manager?.removeEventListener('levelchange', updateBattery);
    };
  }, []);
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return (
    <aside
      className="pc-system-status"
      aria-label={`${time}${battery === undefined ? '' : `, ${battery.level}%`}`}
    >
      <time dateTime={now.toISOString()}>{time}</time>
      {battery === undefined ? null : (
        <span className="pc-system-battery" title={`${battery.level}%`}>
          <i aria-hidden="true">
            <b style={{ width: `${battery.level}%` }} />
          </i>
          <small>
            {battery.charging ? '+' : ''}
            {battery.level}%
          </small>
        </span>
      )}
    </aside>
  );
};

const ProductApp = (): React.JSX.Element => {
  const { t } = useTranslation();
  const [frame, setFrame] = useState<SessionVideoFrame>();
  const [message, setMessage] = useState(t('sessionReady'));
  const [status, setStatus] = useState<ProductStatus>('loading');
  const [startupVisible, setStartupVisible] = useState(true);
  const [screen, setScreen] = useState<AppScreen>('home');
  const [selectedConsoleId, setSelectedConsoleId] = useState<string>();
  const [globalSettingsOpen, setGlobalSettingsOpen] = useState(false);
  const [exitConfirmationOpen, setExitConfirmationOpen] = useState(false);
  const [autosaveChoice, setAutosaveChoice] = useState<{
    readonly game: LibraryGame;
    readonly selected: LibraryLaunchMode;
    readonly updatedAt: string;
  }>();
  const [saveStateSlots, setSaveStateSlots] = useState<readonly SaveStateDescriptor[]>([]);
  const [emulatorCapabilities, setEmulatorCapabilities] = useState<EmulatorCapabilities>({
    fastForward: false,
    rewind: false,
    saveStates: false,
  });
  const [inputPromptScheme, setInputPromptScheme] = useState<InputPromptScheme>('desktop');
  const [consolePlugins, setConsolePlugins] = useState<readonly ConsolePluginAssetEntry[]>([]);
  const [games, setGames] = useState<readonly LibraryGame[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string>();
  const [preferenceLocale, setPreferenceLocale] = useState<GlobalPreferenceLocale>(
    defaultGlobalPreferences.locale,
  );
  const [uiAudioMuted, setUiAudioMuted] = useState(defaultGlobalPreferences.uiAudioMuted);
  const [uiAudioVolume, setUiAudioVolume] = useState(defaultGlobalPreferences.uiAudioVolume);
  const [telemetryConsent, setTelemetryConsent] = useState(
    defaultGlobalPreferences.telemetryConsent,
  );
  const [globalPreferencesReady, setGlobalPreferencesReady] = useState(false);
  const [globalPreferencesWarning, setGlobalPreferencesWarning] = useState(false);
  const [updateState, setUpdateState] = useState<UpdateState>({
    currentVersion: '0.0.0',
    status: 'unsupported',
  });
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
  const sessionScreen = useRef<HTMLDivElement>(null);
  const exitWasRunning = useRef(false);
  const exitConfirmationOpenRef = useRef(false);
  const autosaveChoiceRef = useRef(autosaveChoice);
  const rewindActiveRef = useRef(false);
  const fastForwardActiveRef = useRef(false);
  const emulatorCapabilitiesRef = useRef(emulatorCapabilities);
  const skipGlobalPreferencesSave = useRef(true);

  const consoles = useMemo(
    () => buildConsoleCatalog(consolePlugins, (key) => t(key)),
    [consolePlugins, t],
  );
  const activeConsole = consoles.find((console) => console.id === selectedConsoleId) ?? consoles[0];
  const activeConsoleIndex = Math.max(
    0,
    consoles.findIndex((console) => console.id === activeConsole?.id),
  );
  const selectedGame = games.find((game) => game.id === selectedGameId) ?? games[0];
  const sessionConsole = consoles.find((console) =>
    console.extensions.includes(selectedGame?.extension ?? ''),
  );
  const selectedInputDevice = devices.find(
    (device) => device.fingerprint === profile?.deviceFingerprint,
  );
  const sessionInputPromptScheme =
    profile?.deviceFingerprint === 'keyboard:standard'
      ? 'desktop'
      : classifyGamepadPromptScheme(selectedInputDevice?.label ?? '');
  const sessionInputLabel =
    selectedInputDevice?.label ??
    (profile?.deviceFingerprint === 'keyboard:standard' ? 'Keyboard' : 'Gamepad');

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
    void window.pixelCore.getUpdateState().then(setUpdateState);
    return window.pixelCore.subscribeUpdateState(setUpdateState);
  }, []);
  useEffect(() => {
    screenRef.current = screen;
  }, [screen]);
  useEffect(() => {
    exitConfirmationOpenRef.current = exitConfirmationOpen;
  }, [exitConfirmationOpen]);
  useEffect(() => {
    autosaveChoiceRef.current = autosaveChoice;
  }, [autosaveChoice]);
  useEffect(() => {
    void window.pixelCore.getEmulatorCapabilities().then(setEmulatorCapabilities);
  }, []);
  useEffect(() => {
    emulatorCapabilitiesRef.current = emulatorCapabilities;
  }, [emulatorCapabilities]);
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
      telemetryConsent,
      uiAudioMuted,
      uiAudioVolume,
      version: 2,
    };
    void window.pixelCore.saveGlobalPreferences(preferences).then((response) => {
      if (response.status === 'error') {
        console.warn(
          JSON.stringify({ code: 'global-preferences-save-failed', message: response.message }),
        );
        setGlobalPreferencesWarning(true);
      } else setGlobalPreferencesWarning(false);
    });
  }, [globalPreferencesReady, preferenceLocale, telemetryConsent, uiAudioMuted, uiAudioVolume]);

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
        setTelemetryConsent(preferences.telemetryConsent);
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
      .then((response) => setConsolePlugins(response.plugins));
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

  const applyInputConfiguration = (
    configuration: Awaited<ReturnType<typeof window.pixelCore.getInputConfiguration>>,
  ): void => {
    const compatibleProfile =
      configuration.profile?.mapping.consoleId === configuration.mapping.consoleId &&
      configuration.profile.keyboardBindings.length === DEFAULT_KEYBOARD_BINDINGS.length
        ? configuration.profile
        : undefined;
    const resolvedProfile: InputProfile = compatibleProfile ?? {
      advancedGamepadBindings: [],
      advancedKeyboardBindings: DEFAULT_ADVANCED_KEYBOARD_BINDINGS,
      gamepadBindings: [],
      deviceFingerprint: 'keyboard:standard',
      id: 'default',
      keyboardBindings: DEFAULT_KEYBOARD_BINDINGS,
      mapping: configuration.mapping,
      name: 'Default input profile',
      version: 4,
    };
    inputRuntime.current.assignments.prefer(
      resolvedProfile.mapping.playerPortId,
      resolvedProfile.deviceFingerprint,
    );
    profileRef.current = resolvedProfile;
    keyboard.current.setBindings(resolvedProfile.keyboardBindings);
    setProfile(resolvedProfile);
  };

  useEffect(() => {
    void window.pixelCore.getInputConfiguration().then(applyInputConfiguration);
  }, []);

  useEffect(() => {
    const discovery = new InputDeviceDiscovery({ getGamepads: () => [...navigator.getGamepads()] });
    let animationFrame = 0;
    let previousDevices = '';
    let previousActions = '';
    let previousNavigation = new Set<NormalizedInputAction>();
    let previousCapture = new Set<number>();
    let previousCaptureDevice = '';
    let previousSessionMenu = false;
    let previousSessionButtons = new Set<number>();
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
            device.kind === 'gamepad' && device.fingerprint === currentProfile.deviceFingerprint,
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
          const inputEdges = [...currentCapture].filter((action) => !previousCapture.has(action));
          const inputConsumed =
            screenRef.current === 'library' &&
            inputEdges.some(
              (index) => inputMappingSettings.current?.captureGamepadInput(index) === true,
            );
          previousCapture = currentCapture;
          if (!inputConsumed) {
            if (autosaveChoiceRef.current !== undefined) {
              if (
                (currentNavigation.has('move-left') && !previousNavigation.has('move-left')) ||
                (currentNavigation.has('move-right') && !previousNavigation.has('move-right'))
              )
                setAutosaveChoice((current) =>
                  current === undefined
                    ? undefined
                    : {
                        ...current,
                        selected:
                          current.selected === 'restore-autosave' ? 'fresh' : 'restore-autosave',
                      },
                );
              if (currentNavigation.has('primary') && !previousNavigation.has('primary'))
                void confirmAutosaveChoice();
              if (currentNavigation.has('secondary') && !previousNavigation.has('secondary'))
                setAutosaveChoice(undefined);
              previousNavigation = currentNavigation;
              animationFrame = requestAnimationFrame(poll);
              return;
            }
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
        const sessionMenuPressed = selectedSnapshot?.buttons[9]?.pressed === true;
        if (
          (statusRef.current === 'running' || statusRef.current === 'paused') &&
          sessionMenuPressed &&
          !previousSessionMenu &&
          !exitConfirmationOpenRef.current
        )
          void runAction(statusRef.current === 'paused' ? 'resume' : 'pause');
        previousSessionMenu = sessionMenuPressed;
        const sessionButtons = new Set(
          selectedSnapshot === null || selectedSnapshot === undefined
            ? []
            : readPressedGamepadButtons(selectedSnapshot),
        );
        const rewindPressed = sessionButtons.has(
          gamepadButtonForAdvancedCommand(
            currentProfile,
            currentProfile.deviceFingerprint,
            'rewind',
          ) ?? -1,
        );
        if (
          emulatorCapabilitiesRef.current.rewind &&
          statusRef.current === 'running' &&
          rewindPressed !== rewindActiveRef.current
        ) {
          rewindActiveRef.current = rewindPressed;
          void window.pixelCore.setRewindActive(rewindPressed);
        }
        const fastForwardPressed = sessionButtons.has(
          gamepadButtonForAdvancedCommand(
            currentProfile,
            currentProfile.deviceFingerprint,
            'fast-forward',
          ) ?? -1,
        );
        if (
          emulatorCapabilitiesRef.current.fastForward &&
          statusRef.current === 'running' &&
          fastForwardPressed !== fastForwardActiveRef.current
        ) {
          fastForwardActiveRef.current = fastForwardPressed;
          void window.pixelCore.setFastForwardActive(fastForwardPressed);
        }
        const sessionButtonEdges = [...sessionButtons].filter(
          (index) => !previousSessionButtons.has(index),
        );
        if (statusRef.current === 'paused') {
          if (exitConfirmationOpenRef.current) {
            if (sessionButtonEdges.includes(0)) void cancelSessionExit();
            else if (sessionButtonEdges.includes(1)) void confirmSessionExit();
          } else if (sessionButtonEdges.includes(0)) void runAction('resume');
          else if (sessionButtonEdges.includes(1)) void requestSessionExit();
        }
        previousSessionButtons = sessionButtons;
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
        if (
          emulatorCapabilitiesRef.current.rewind &&
          event.code ===
            (profileRef.current === undefined
              ? 'KeyQ'
              : keyboardCodeForAdvancedCommand(profileRef.current, 'rewind'))
        ) {
          event.preventDefault();
          if (rewindActiveRef.current !== pressed && statusRef.current === 'running') {
            rewindActiveRef.current = pressed;
            void window.pixelCore.setRewindActive(pressed);
          }
          return;
        }
        if (
          emulatorCapabilitiesRef.current.fastForward &&
          event.code ===
            (profileRef.current === undefined
              ? 'KeyE'
              : keyboardCodeForAdvancedCommand(profileRef.current, 'fast-forward'))
        ) {
          event.preventDefault();
          if (fastForwardActiveRef.current !== pressed && statusRef.current === 'running') {
            fastForwardActiveRef.current = pressed;
            void window.pixelCore.setFastForwardActive(pressed);
          }
          return;
        }
        if (pressed && event.code === 'Escape') {
          event.preventDefault();
          if (exitConfirmationOpenRef.current) void cancelSessionExit();
          else void runAction(statusRef.current === 'paused' ? 'resume' : 'pause');
          return;
        }
        if (keyboardHandled) event.preventDefault();
        return;
      }
      if (!pressed || editable) return;
      if (autosaveChoiceRef.current !== undefined) {
        if (event.code === 'ArrowLeft' || event.code === 'ArrowRight') {
          event.preventDefault();
          setAutosaveChoice((current) =>
            current === undefined
              ? undefined
              : {
                  ...current,
                  selected: current.selected === 'restore-autosave' ? 'fresh' : 'restore-autosave',
                },
          );
        } else if (event.code === 'Enter') {
          event.preventDefault();
          void confirmAutosaveChoice();
        } else if (event.code === 'Escape' || event.code === 'Backspace') {
          event.preventDefault();
          setAutosaveChoice(undefined);
        }
        return;
      }
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
  const changeAdvancedKeyboardBinding = (command: string, code: string): void => {
    if (profile === undefined) return;
    const typedCommand = command as AdvancedInputCommand;
    const nextBindings = rebindAdvancedKeyboard(
      profile.advancedKeyboardBindings,
      typedCommand,
      code,
    );
    if (nextBindings === profile.advancedKeyboardBindings) return;
    persistProfile({
      ...profile,
      advancedKeyboardBindings: nextBindings,
    });
    uiAudio.play('toggle-on');
  };
  const changeAdvancedGamepadBinding = (command: string, index: number): void => {
    if (profile === undefined || profile.deviceFingerprint === 'keyboard:standard') return;
    const typedCommand = command as AdvancedInputCommand;
    const deviceFingerprint = profile.deviceFingerprint;
    const bindings = advancedBindingsForGamepad(profile, deviceFingerprint);
    const nextBindings = rebindAdvancedGamepad(bindings, typedCommand, index);
    if (nextBindings === bindings) return;
    persistProfile({
      ...profile,
      advancedGamepadBindings: [
        ...profile.advancedGamepadBindings.filter(
          (set) => set.deviceFingerprint !== deviceFingerprint,
        ),
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
  const launchGame = async (game: LibraryGame, mode?: LibraryLaunchMode): Promise<void> => {
    if (mode !== undefined) setAutosaveChoice(undefined);
    await audio.current.start();
    setSelectedGameId(game.id);
    setStatus('starting');
    setMessage(`${t('loading')} ${game.name}`);
    uiAudio.play('launch');
    const result = await window.pixelCore.startLibraryGame(game.id, mode);
    if (result.status === 'autosave-available') {
      setStatus('ready');
      setAutosaveChoice({ game, selected: 'restore-autosave', updatedAt: result.updatedAt });
      uiAudio.play('open');
      return;
    }
    if (result.status === 'error') {
      setStatus('error');
      setMessage(result.message);
      uiAudio.play('error');
      return;
    }
    setStatus('running');
    setMessage(game.name);
    await refreshLibrary();
    const nextCapabilities = await window.pixelCore.getEmulatorCapabilities();
    setEmulatorCapabilities(nextCapabilities);
    emulatorCapabilitiesRef.current = nextCapabilities;
    applyInputConfiguration(await window.pixelCore.getInputConfiguration());
    setStatus('running');
  };
  const confirmAutosaveChoice = async (): Promise<void> => {
    const choice = autosaveChoiceRef.current;
    if (choice === undefined) return;
    setAutosaveChoice(undefined);
    await launchGame(choice.game, choice.selected);
  };
  const runAction = async (action: 'pause' | 'resume' | 'stop'): Promise<void> => {
    if (action !== 'resume' && rewindActiveRef.current) {
      rewindActiveRef.current = false;
      await window.pixelCore.setRewindActive(false);
    }
    if (action !== 'resume' && fastForwardActiveRef.current) {
      fastForwardActiveRef.current = false;
      await window.pixelCore.setFastForwardActive(false);
    }
    const result = await window.pixelCore[`${action}Session`]();
    if (result.status === 'error') {
      setStatus('error');
      setMessage(result.message);
      uiAudio.play('error');
      return;
    }
    const next = result.sessionStatus as ProductStatus;
    setStatus(next);
    if (action === 'pause') {
      const listed = await window.pixelCore.listSaveStates();
      if (listed.status === 'ok') setSaveStateSlots(listed.slots);
    }
    uiAudio.play(action === 'stop' ? 'back' : action);
    if (action === 'stop') {
      setFrame(undefined);
    }
  };
  const runSaveStateAction = async (action: 'capture' | 'restore', slot: SaveStateSlot) => {
    const result =
      await window.pixelCore[action === 'capture' ? 'captureSaveState' : 'restoreSaveState'](slot);
    if (result.status === 'error') {
      setMessage(result.message);
      uiAudio.play('error');
      return;
    }
    const listed = await window.pixelCore.listSaveStates();
    if (listed.status === 'ok') setSaveStateSlots(listed.slots);
    uiAudio.play('success');
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

  const requestSessionExit = async (): Promise<void> => {
    exitWasRunning.current = statusRef.current === 'running';
    if (exitWasRunning.current) await runAction('pause');
    setExitConfirmationOpen(true);
  };
  const cancelSessionExit = async (): Promise<void> => {
    setExitConfirmationOpen(false);
    if (exitWasRunning.current) await runAction('resume');
  };
  const confirmSessionExit = async (): Promise<void> => {
    setExitConfirmationOpen(false);
    await runAction('stop');
  };
  const applyAmbientPalette = (palette: EmulatorAmbientPalette): void => {
    const element = sessionScreen.current;
    if (element === null || statusRef.current === 'paused') return;
    element.style.setProperty('--ambient-top', palette.top);
    element.style.setProperty('--ambient-right', palette.right);
    element.style.setProperty('--ambient-bottom', palette.bottom);
    element.style.setProperty('--ambient-left', palette.left);
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
      <InputPromptProvider assetMap={kenneyInputPromptAssets} scheme={sessionInputPromptScheme}>
        <main className="pc-session-view">
          {selectedGame?.artworkDataUrl === undefined ? null : (
            <img
              alt=""
              aria-hidden="true"
              className="pc-session-artwork-background"
              src={selectedGame.artworkDataUrl}
            />
          )}
          {sessionConsole?.assets?.sessionBackdropUrl === undefined ? null : (
            <img
              alt=""
              aria-hidden="true"
              className="pc-session-console-backdrop"
              src={sessionConsole.assets?.sessionBackdropUrl}
            />
          )}
          <header className="pc-session-header">
            <button
              className="pc-ghost-button"
              onClick={() => void requestSessionExit()}
              type="button"
            >
              <Icon name="archive" /> {t('stop')}
            </button>
            <h1>{selectedGame?.name ?? message}</h1>
            <span
              className="pc-session-controller"
              aria-label={sessionInputLabel}
              title={sessionInputLabel}
            >
              <InputPrompt action="navigate-all" label={sessionInputLabel} />
              <small>{sessionInputLabel}</small>
            </span>
            <button
              className="pc-session-pause-button"
              disabled={status === 'starting'}
              onClick={() => void runAction(status === 'paused' ? 'resume' : 'pause')}
              type="button"
            >
              {t(status === 'paused' ? 'resume' : 'pause')}
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
            <div
              className={`pc-session-screen${status === 'paused' ? ' is-paused' : ''}`}
              ref={sessionScreen}
            >
              <EmulatorVideoCanvas
                {...(frame === undefined ? {} : { frame })}
                label={message}
                onAmbientPalette={applyAmbientPalette}
              />
            </div>
            {status === 'paused' && !exitConfirmationOpen ? (
              <div className="pc-session-overlay" role="dialog" aria-modal="true">
                <strong>{t('statusPaused')}</strong>
                <section className="pc-save-state-panel" aria-label={t('saveStates')}>
                  {(['slot-1', 'slot-2', 'slot-3'] as const).map((slot, index) => {
                    const saved = saveStateSlots.find((entry) => entry.slot === slot);
                    return (
                      <article key={slot}>
                        <div>
                          <b>{t('saveSlot', { number: index + 1 })}</b>
                          <small>
                            {saved === undefined
                              ? t('emptySlot')
                              : new Date(saved.updatedAt).toLocaleString()}
                          </small>
                        </div>
                        <button
                          onClick={() => void runSaveStateAction('capture', slot)}
                          type="button"
                        >
                          {t('saveState')}
                        </button>
                        <button
                          disabled={saved === undefined}
                          onClick={() => void runSaveStateAction('restore', slot)}
                          type="button"
                        >
                          {t('loadState')}
                        </button>
                      </article>
                    );
                  })}
                </section>
                {emulatorCapabilities.rewind || emulatorCapabilities.fastForward ? (
                  <small className="pc-session-advanced-hint">
                    {[
                      emulatorCapabilities.rewind ? `${t('rewind')} · Q / LT` : undefined,
                      emulatorCapabilities.fastForward ? `${t('fastForward')} · E / RT` : undefined,
                    ]
                      .filter((label): label is string => label !== undefined)
                      .join(' · ')}
                  </small>
                ) : null}
                <button
                  className="pc-primary-button"
                  onClick={() => void runAction('resume')}
                  type="button"
                >
                  <Icon name="gamepad" /> {t('continuePlaying')}
                </button>
                <InputPromptGroup actions={['primary', 'secondary']} label={t('gameControls')} />
              </div>
            ) : null}
            {exitConfirmationOpen ? (
              <div
                className="pc-session-overlay pc-session-exit"
                role="alertdialog"
                aria-modal="true"
              >
                <strong>{t('exitQuestion')}</strong>
                <div>
                  <button
                    className="pc-primary-button"
                    onClick={() => void cancelSessionExit()}
                    type="button"
                  >
                    {t('continuePlaying')}
                  </button>
                  <button
                    className="pc-ghost-button"
                    onClick={() => void confirmSessionExit()}
                    type="button"
                  >
                    {t('exitToLibrary')}
                  </button>
                </div>
                <InputPromptGroup actions={['primary', 'secondary']} label={t('gameControls')} />
              </div>
            ) : null}
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
            initialIndex={activeConsoleIndex}
            logoUrl={logoUrl}
            onConfirm={(item) => {
              if (item.availability === 'coming-soon') {
                uiAudio.play('warning');
                return;
              }
              uiAudio.play('select');
              setSelectedConsoleId(item.id);
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
                exit: t('exitApplication'),
                language: t('interfaceLanguage'),
                muted: t('muted'),
                moveHint: t('settingsMoveHint'),
                sounds: t('feedbackSounds'),
                soundsOn: t('soundsOn'),
                title: t('globalSettings'),
                updates: t('updates'),
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
              onExit={() => void window.pixelCore.quitApplication()}
              onMutedChange={setUiAudioMuted}
              onUpdate={() => {
                if (updateState.status === 'available') void window.pixelCore.downloadUpdate();
                else if (updateState.status === 'downloaded') void window.pixelCore.installUpdate();
                else if (!['checking', 'downloading', 'unsupported'].includes(updateState.status))
                  void window.pixelCore.checkForUpdates();
              }}
              onNavigate={() => uiAudio.play('focus')}
              onVolumeChange={setUiAudioVolume}
              ref={globalSettings}
              updateValue={
                updateState.status === 'checking'
                  ? t('updateChecking')
                  : updateState.status === 'available'
                    ? t('updateAvailable', { version: updateState.version })
                    : updateState.status === 'downloading'
                      ? t('updateDownloading', { percent: Math.round(updateState.percent) })
                      : updateState.status === 'downloaded'
                        ? t('updateReady', { version: updateState.version })
                        : updateState.status === 'not-available'
                          ? t('updateCurrent')
                          : updateState.status === 'error'
                            ? t('updateError')
                            : updateState.status === 'unsupported'
                              ? t('updateUnsupported')
                              : t('updateCheck')
              }
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
        {activeConsole === undefined ? null : (
          <>
            <ConsoleLibrary
              artworkFor={(game) => game.artworkDataUrl}
              {...(activeConsole.assets?.cartridgeUrl === undefined
                ? {}
                : { cartridgeUrl: activeConsole.assets.cartridgeUrl })}
              {...(activeConsole.assets?.cartridgeLabelLayout === undefined
                ? {}
                : { cartridgeLabelLayout: activeConsole.assets.cartridgeLabelLayout })}
              console={activeConsole}
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
              games={games.filter((game) => activeConsole.extensions.includes(game.extension))}
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
                  advancedBindings={[
                    ...(emulatorCapabilities.rewind
                      ? [
                          {
                            command: 'rewind',
                            gamepadIndex:
                              gamepadButtonForAdvancedCommand(
                                profile,
                                profile.deviceFingerprint,
                                'rewind',
                              ) ?? 6,
                            keyboardCode:
                              keyboardCodeForAdvancedCommand(profile, 'rewind') ?? 'KeyQ',
                            label: t('rewind'),
                          },
                        ]
                      : []),
                    ...(emulatorCapabilities.fastForward
                      ? [
                          {
                            command: 'fast-forward',
                            gamepadIndex:
                              gamepadButtonForAdvancedCommand(
                                profile,
                                profile.deviceFingerprint,
                                'fast-forward',
                              ) ?? 7,
                            keyboardCode:
                              keyboardCodeForAdvancedCommand(profile, 'fast-forward') ?? 'KeyE',
                            label: t('fastForward'),
                          },
                        ]
                      : []),
                  ]}
                  assetMap={kenneyInputPromptAssets}
                  copy={{
                    assigned: t('mappingAssigned'),
                    advancedControls: t('advancedControls'),
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
                  diagram={
                    activeConsole?.assets?.controlDiagram === undefined ||
                    activeConsole.assets?.blueprintUrl === undefined
                      ? { alt: t('gameControls'), assetUrl: '', controlPoints: [] }
                      : {
                          alt: activeConsole.assets.controlDiagram.alt,
                          assetUrl: activeConsole.assets.blueprintUrl,
                          controlPoints: activeConsole.assets.controlDiagram.controlPoints,
                        }
                  }
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
                  onAdvancedGamepadBindingChange={changeAdvancedGamepadBinding}
                  onAdvancedKeyboardBindingChange={changeAdvancedKeyboardBinding}
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
            {autosaveChoice === undefined ? null : (
              <div className="pc-autosave-choice" role="dialog" aria-modal="true">
                <section>
                  <small>{t('autosaveFound')}</small>
                  <strong>{autosaveChoice.game.name}</strong>
                  <p>
                    {t('autosaveUpdated', {
                      date: new Date(autosaveChoice.updatedAt).toLocaleString(),
                    })}
                  </p>
                  <div>
                    <button
                      className={
                        autosaveChoice.selected === 'restore-autosave' ? 'is-selected' : ''
                      }
                      onClick={() => void launchGame(autosaveChoice.game, 'restore-autosave')}
                      type="button"
                    >
                      {t('continueAutosave')}
                    </button>
                    <button
                      className={autosaveChoice.selected === 'fresh' ? 'is-selected' : ''}
                      onClick={() => void launchGame(autosaveChoice.game, 'fresh')}
                      type="button"
                    >
                      {t('startNormally')}
                    </button>
                  </div>
                  <InputPromptGroup
                    actions={['navigate-horizontal', 'primary', 'secondary']}
                    label={t('gameControls')}
                  />
                </section>
              </div>
            )}
          </>
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
createRoot(root).render(
  <>
    <ProductApp />
    <SystemStatus />
  </>,
);
