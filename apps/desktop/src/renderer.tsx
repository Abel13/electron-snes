import { createRoot } from 'react-dom/client';
import { EmulatorVideoCanvas } from '@platform/ui';
import './renderer.css';

const App = (): React.JSX.Element => (
  <main className="pixelcore-app-shell">
    <div aria-hidden="true" className="pixelcore-orbit one" />
    <div aria-hidden="true" className="pixelcore-orbit two" />
    <header>
      <p>PixelCore / Game Boy Family</p>
      <span>
        <i /> Session ready
      </span>
    </header>
    <section>
      <div className="pixelcore-display">
        <EmulatorVideoCanvas label="Select a Game Boy ROM to begin" />
      </div>
      <div className="pixelcore-copy">
        <p>Playable session</p>
        <h1>
          Preserve the game.
          <br />
          Feel the moment.
        </h1>
        <small>Video frames stay sharp. Every interaction stays intentional.</small>
      </div>
    </section>
    <footer>
      Game Boy + Game Boy Color <b>01 / 01</b>
    </footer>
  </main>
);
const root = document.getElementById('root');
if (root === null) throw new Error('PixelCore renderer root is missing.');
createRoot(root).render(<App />);
