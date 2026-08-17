import { renderToStaticMarkup } from 'react-dom/server';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { ConsoleCatalogItem } from '@platform/ui-contracts';
import { ConsoleCarousel, rotateCarouselIndex } from './console-carousel.js';

const items: ConsoleCatalogItem[] = [
  {
    accentColor: '#22e1dc',
    artworkUrl: '/handheld.webp',
    availability: 'available' as const,
    extensions: ['.gb', '.gbc'],
    generation: 'Handheld generation',
    id: 'org.pixelcore.game-boy-family',
    name: 'Game Boy Family',
  },
  {
    accentColor: '#ffad49',
    artworkUrl: '/future.webp',
    availability: 'coming-soon' as const,
    extensions: ['Coming soon'],
    generation: '8-bit generation',
    id: 'org.pixelcore.product.nes',
    name: 'NES',
  },
];

const copy = {
  available: 'Available',
  chooseSystem: 'Choose your system',
  comingSoon: 'Coming soon',
  confirm: 'Enter system',
  formats: 'Formats',
  next: 'Next system',
  position: (current: number, total: number) => `${current} of ${total}`,
  previous: 'Previous system',
  unavailable: (name: string) => `${name} is coming soon`,
};

describe('ConsoleCarousel', () => {
  it('wraps selection in both directions', () => {
    expect(rotateCarouselIndex(0, 'left', 4)).toBe(3);
    expect(rotateCarouselIndex(3, 'right', 4)).toBe(0);
  });

  it('renders only the selected console as an interactive selection', () => {
    const markup = renderToStaticMarkup(
      <ConsoleCarousel
        copy={copy}
        items={items}
        logoUrl="/logo.png"
        onConfirm={vi.fn()}
        onFocusSound={vi.fn()}
        ref={createRef()}
      />,
    );
    expect(markup).toContain('Game Boy Family');
    expect(markup).not.toContain('NES</h1>');
    expect(markup).toContain('aria-live="polite"');
    expect(markup).toContain('aria-label="Previous system"');
  });

  it('starts at the requested console when returning to the carousel', () => {
    const markup = renderToStaticMarkup(
      <ConsoleCarousel
        copy={copy}
        initialIndex={1}
        items={[
          {
            accentColor: '#22e1dc',
            artworkUrl: '/first.webp',
            availability: 'available',
            extensions: ['.gba'],
            generation: '32-bit generation',
            id: 'first',
            name: 'First',
          },
          {
            accentColor: '#ffad49',
            artworkUrl: '/second.webp',
            availability: 'available',
            extensions: ['.gba'],
            generation: '32-bit generation',
            id: 'second',
            name: 'Second',
          },
        ]}
        logoUrl="/logo.png"
        onConfirm={vi.fn()}
        onFocusSound={vi.fn()}
      />,
    );
    expect(markup).toContain('<h1>Second</h1>');
  });
});
