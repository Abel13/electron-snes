import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { EmulatorVideoCanvas, extractAmbientPalette } from './emulator-video-canvas.js';

describe('EmulatorVideoCanvas', () => {
  it('extracts independent ambient colors from frame edges', () => {
    const palette = extractAmbientPalette({
      height: 2,
      pixels: new Uint8Array([255, 0, 0, 255, 255, 0, 0, 255, 0, 0, 255, 255, 0, 0, 255, 255]),
      width: 2,
    });
    expect(palette.top).not.toBe('rgb(255 255 255)');
    expect(palette.bottom).not.toBe('rgb(0 0 0)');
    expect(palette.left).toContain('rgb(');
    expect(palette.right).toContain('rgb(');
  });
  it('renders an accessible empty video surface before the first frame', () => {
    const markup = renderToStaticMarkup(
      <EmulatorVideoCanvas label="Select a Game Boy ROM to begin" />,
    );

    expect(markup).toContain('aria-label="Select a Game Boy ROM to begin"');
    expect(markup).toContain('Select a Game Boy ROM to begin');
  });
});
