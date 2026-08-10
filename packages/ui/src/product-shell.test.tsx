import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { LibraryShell } from './product-shell.js';

describe('LibraryShell', () => {
  it('renders semantic navigation, search, game actions, and decorative particles', () => {
    const copy = {
      addGame: 'Add game',
      allGames: 'All games',
      archive: 'Archive',
      artwork: 'Artwork',
      emptyAction: 'Choose ROM',
      emptyBody: 'Private local library',
      emptyTitle: 'Archive ready',
      favorites: 'Favorites',
      interfaceLanguage: 'Interface language',
      language: 'Language',
      library: 'Library',
      localPrivate: 'Private',
      play: 'Play now',
      ready: 'Ready',
      readyToPlay: 'Ready to play',
      recent: 'Recent',
      search: 'Search',
      settings: 'Settings',
    };
    const markup = renderToStaticMarkup(
      <LibraryShell
        artworkFor={() => '/cover.png'}
        copy={copy}
        games={[{ extension: '.gb', favorite: false, id: 'game-1', name: 'Original game' }]}
        locale="en-US"
        logoUrl="/logo.png"
        onAddGame={vi.fn()}
        onArtwork={vi.fn()}
        onFavorite={vi.fn()}
        onLocaleChange={vi.fn()}
        onPlay={vi.fn()}
        onQueryChange={vi.fn()}
        onViewChange={vi.fn()}
        query=""
        view="library"
      />,
    );
    expect(markup).toContain('aria-label="Library"');
    expect(markup).toContain('type="search"');
    expect(markup).toContain('Original game');
    expect(markup).toContain('aria-hidden="true" class="pc-particles"');
  });
});
