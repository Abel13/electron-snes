import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { EmulatorVideoCanvas } from './emulator-video-canvas.js';

describe('EmulatorVideoCanvas', () => {
  it('renders an accessible empty video surface before the first frame', () => {
    const markup = renderToStaticMarkup(
      <EmulatorVideoCanvas label="Select a Game Boy ROM to begin" />,
    );

    expect(markup).toContain('aria-label="Select a Game Boy ROM to begin"');
    expect(markup).toContain('Select a Game Boy ROM to begin');
  });
});
