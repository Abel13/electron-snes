import { createRoot } from 'react-dom/client';
import { useEffect, useRef, useState } from 'react';
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
import { EmulatorAudioPlayer, EmulatorVideoCanvas, InputMappingSettings } from '@platform/ui';
import type { PixelCoreApi, SessionVideoFrame } from './ipc.js';
import './renderer.css';

declare global {
  interface Window {
    readonly pixelCore: PixelCoreApi;
  }
}

const App = (): React.JSX.Element => {
  const [frame, setFrame] = useState<SessionVideoFrame>();
  const [message, setMessage] = useState('Select a Game Boy ROM to begin');
  const [status, setStatus] = useState('ready');
  const audio = useRef(new EmulatorAudioPlayer());
  const keyboard = useRef(new KeyboardInputAdapter());
  const gamepad = useRef(new GamepadInputAdapter());
  const inputRuntime = useRef(new UniversalInputRuntime());
  const [devices, setDevices] = useState<readonly InputDeviceDescriptor[]>([]);
  const [profile, setProfile] = useState<InputProfile>();
  const profileRef = useRef<InputProfile | undefined>(undefined);
  const statusRef = useRef(status);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  useEffect(() => {
    const unsubscribeVideo = window.pixelCore.subscribeSessionVideo(setFrame);
    const unsubscribeAudio = window.pixelCore.subscribeSessionAudio((audioFrame) =>
      audio.current.enqueue(audioFrame),
    );
    return () => {
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
    const discovery = new InputDeviceDiscovery({
      getGamepads: () => [...navigator.getGamepads()],
    });
    let animationFrame = 0;
    let previousDevices = '';
    let previousActions = '';

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
        const mapped =
          deviceId === undefined
            ? []
            : inputRuntime.current.mapPlayerActions(
                currentProfile.mapping.playerPortId,
                deviceId,
                actions,
                currentProfile.mapping,
              );
        const actionSignature = mapped.join('|');
        if (
          actionSignature !== previousActions &&
          (statusRef.current === 'running' || statusRef.current === 'paused')
        ) {
          previousActions = actionSignature;
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
      if (keyboard.current.handle({ code: event.code, editable, pressed })) event.preventDefault();
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
  };

  const selectAndStart = async (): Promise<void> => {
    await audio.current.start();
    const selected = await window.pixelCore.selectRom();
    if (selected.status === 'cancelled') return;
    setStatus('starting');
    setMessage(`Starting ${selected.rom.name}`);
    const result = await window.pixelCore.startSession(selected.rom.id);
    if (result.status === 'error') {
      setStatus('error');
      setMessage(result.message);
      return;
    }
    setStatus(result.sessionStatus);
    setMessage(`${selected.rom.name} is running`);
  };

  const runAction = async (action: 'pause' | 'resume' | 'stop'): Promise<void> => {
    const result = await window.pixelCore[`${action}Session`]();
    if (result.status === 'error') {
      setStatus('error');
      setMessage(result.message);
      return;
    }
    setStatus(result.sessionStatus);
    setMessage(`Session ${result.sessionStatus}`);
  };

  return (
    <main className="pixelcore-app-shell">
      <div aria-hidden="true" className="pixelcore-orbit one" />
      <div aria-hidden="true" className="pixelcore-orbit two" />
      <header>
        <p>PixelCore / Game Boy Family</p>
        <span>
          <i /> Session {status}
        </span>
      </header>
      <section>
        <div className="pixelcore-display">
          <EmulatorVideoCanvas {...(frame === undefined ? {} : { frame })} label={message} />
        </div>
        <div className="pixelcore-copy">
          <p>Playable session</p>
          <h1>
            Preserve the game.
            <br />
            Feel the moment.
          </h1>
          <small aria-live="polite">{message}</small>
          <div className="pixelcore-session-controls">
            <button type="button" onClick={() => void selectAndStart()}>
              Select ROM
            </button>
            <button
              type="button"
              onClick={() => void runAction('pause')}
              disabled={status !== 'running'}
            >
              Pause
            </button>
            <button
              type="button"
              onClick={() => void runAction('resume')}
              disabled={status !== 'paused'}
            >
              Resume
            </button>
            <button
              type="button"
              onClick={() => void runAction('stop')}
              disabled={status !== 'running' && status !== 'paused'}
            >
              Stop
            </button>
          </div>
          {profile === undefined ? null : (
            <InputMappingSettings
              devices={devices}
              entries={profile.mapping.entries}
              onDeviceChange={(deviceFingerprint) =>
                persistProfile({ ...profile, deviceFingerprint })
              }
              onMappingChange={changeMapping}
              selectedDeviceFingerprint={profile.deviceFingerprint}
            />
          )}
        </div>
      </section>
      <footer>
        Game Boy + Game Boy Color <b>01 / 01</b>
      </footer>
    </main>
  );
};
const root = document.getElementById('root');
if (root === null) throw new Error('PixelCore renderer root is missing.');
createRoot(root).render(<App />);
