import { createRoot } from 'react-dom/client';
import { useEffect, useRef, useState } from 'react';
import { EmulatorAudioPlayer, EmulatorVideoCanvas } from '@platform/ui';
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
