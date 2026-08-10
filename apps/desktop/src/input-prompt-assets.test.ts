import type { InputPromptAction, InputPromptScheme } from '@platform/ui';
import { describe, expect, it } from 'vitest';
import { kenneyInputPromptAssets } from './input-prompt-assets.js';

const schemes: readonly InputPromptScheme[] = ['desktop', 'xbox', 'playstation'];
const actions: readonly InputPromptAction[] = [
  'back',
  'confirm',
  'navigate-all',
  'navigate-horizontal',
  'navigate-vertical',
  'primary',
  'secondary',
  'select',
  'settings',
  'start',
];

describe('Kenney input prompt assets', () => {
  it.each(schemes)('maps every semantic action for %s', (scheme) => {
    for (const action of actions) {
      const assets = kenneyInputPromptAssets[scheme][action];
      expect(assets.length).toBeGreaterThan(0);
      expect(assets.every(({ src }) => src.endsWith('.svg'))).toBe(true);
    }
  });
});
