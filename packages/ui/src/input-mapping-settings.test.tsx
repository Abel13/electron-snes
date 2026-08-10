import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { InputMappingSettings } from './input-mapping-settings.js';

describe('InputMappingSettings', () => {
  it('renders accessible device and action controls', () => {
    const markup = renderToStaticMarkup(
      <InputMappingSettings
        devices={[
          {
            connected: true,
            fingerprint: 'keyboard:standard',
            label: 'Keyboard',
          },
        ]}
        entries={[{ consoleAction: 'a', normalizedAction: 'primary' }]}
        onDeviceChange={vi.fn()}
        onMappingChange={vi.fn()}
        selectedDeviceFingerprint="keyboard:standard"
      />,
    );
    expect(markup).toContain('Player one device');
    expect(markup).toContain('aria-label="primary console action"');
    expect(markup).toContain('Keyboard');
  });
});
