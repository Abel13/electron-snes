import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Icon, type IconName } from './icons.js';

const iconNames: readonly IconName[] = [
  'archive',
  'clock',
  'gamepad',
  'grid',
  'heart',
  'plus',
  'search',
  'settings',
  'sparkles',
];

describe('Icon', () => {
  it.each(iconNames)('renders the semantic %s icon with Lucide', (name) => {
    const markup = renderToStaticMarkup(<Icon name={name} />);
    expect(markup).toContain('<svg');
    expect(markup).toContain('class="lucide lucide-');
    expect(markup).toContain('aria-hidden="true"');
    expect(markup).toContain('focusable="false"');
    expect(markup).toContain('stroke-width="1.7"');
  });

  it('forwards visual SVG properties and allows stroke width overrides', () => {
    const markup = renderToStaticMarkup(
      <Icon className="custom-icon" color="cyan" name="settings" size={32} strokeWidth={2.25} />,
    );
    expect(markup).toContain('class="lucide lucide-settings custom-icon"');
    expect(markup).toContain('height="32"');
    expect(markup).toContain('width="32"');
    expect(markup).toContain('stroke="cyan"');
    expect(markup).toContain('stroke-width="2.25"');
  });
});
