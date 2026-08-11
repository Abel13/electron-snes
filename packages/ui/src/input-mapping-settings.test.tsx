import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { InputMappingSettings } from './input-mapping-settings.js';

describe('InputMappingSettings', () => {
  it('renders accessible device and action controls', () => {
    const markup = renderToStaticMarkup(
      <InputMappingSettings
        advancedBindings={[
          { command: 'rewind', gamepadIndex: 6, keyboardCode: 'KeyQ', label: 'Rewind' },
        ]}
        devices={[
          {
            connected: true,
            fingerprint: 'keyboard:standard',
            label: 'Keyboard',
          },
        ]}
        diagram={{
          alt: 'Portable console blueprint',
          assetUrl: '/console.svg',
          controlPoints: [{ action: 'a', x: 70, y: 50 }],
        }}
        entries={[{ consoleAction: 'a', normalizedAction: 'primary' }]}
        keyboardBindings={[{ code: 'KeyZ', normalizedAction: 'primary' }]}
        onDeviceChange={vi.fn()}
        onMappingChange={vi.fn()}
        onKeyboardBindingChange={vi.fn()}
        onGamepadBindingChange={vi.fn()}
        promptScheme="desktop"
        selectedDeviceFingerprint="keyboard:standard"
        selectedDeviceKind="keyboard"
      />,
    );
    expect(markup).toContain('Player one device');
    expect(markup).toContain('Portable console blueprint');
    expect(markup).toContain('PRIMARY');
    expect(markup).toContain('Keyboard');
    expect(markup).toContain('Advanced controls');
    expect(markup).toContain('Rewind');
    expect(markup).toContain('Choose a device, then confirm to configure its buttons.');
    expect(markup).toContain('aria-current="true"');
    expect(markup).not.toContain('<select');
  });
});
