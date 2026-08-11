import { describe, expect, it } from 'vitest';
import {
  adjustSettingsVolume,
  cycleSettingsOption,
  moveSettingsIndex,
} from './global-settings-menu.js';

describe('global settings navigation', () => {
  it('keeps vertical selection within the menu', () => {
    expect(moveSettingsIndex(0, 'up')).toBe(0);
    expect(moveSettingsIndex(0, 'down')).toBe(1);
    expect(moveSettingsIndex(2, 'down')).toBe(3);
    expect(moveSettingsIndex(3, 'down')).toBe(3);
  });
  it('cycles declared options', () => {
    expect(cycleSettingsOption(0, 'left', 3)).toBe(2);
    expect(cycleSettingsOption(2, 'right', 3)).toBe(0);
  });
  it('uses bounded five-percent volume steps', () => {
    expect(adjustSettingsVolume(0.5, 'right')).toBe(0.55);
    expect(adjustSettingsVolume(1, 'right')).toBe(1);
    expect(adjustSettingsVolume(0, 'left')).toBe(0);
  });
});
