import type { ReactNode } from 'react';
import { Icon, type IconName } from './icons.js';

export type ProductView = 'library' | 'favorites' | 'recent' | 'settings';

export interface LibraryGameView {
  readonly artworkDataUrl?: string;
  readonly extension: '.gb' | '.gbc' | '.gba';
  readonly favorite: boolean;
  readonly id: string;
  readonly lastPlayedAt?: string;
  readonly name: string;
}

export interface ProductCopy {
  readonly addGame: string;
  readonly allGames: string;
  readonly archive: string;
  readonly artwork: string;
  readonly emptyAction: string;
  readonly emptyBody: string;
  readonly emptyTitle: string;
  readonly favorites: string;
  readonly interfaceLanguage: string;
  readonly language: string;
  readonly library: string;
  readonly localPrivate: string;
  readonly play: string;
  readonly recent: string;
  readonly ready: string;
  readonly readyToPlay: string;
  readonly search: string;
  readonly settings: string;
  readonly systems: string;
}

export interface LibraryShellProps {
  readonly artworkFor: (game: LibraryGameView) => string;
  readonly children?: ReactNode;
  readonly copy: ProductCopy;
  readonly games: readonly LibraryGameView[];
  readonly locale: string;
  readonly logoUrl: string;
  readonly onAddGame: () => void;
  readonly onArtwork: (game: LibraryGameView) => void;
  readonly onFavorite: (game: LibraryGameView) => void;
  readonly onLocaleChange: (locale: string) => void;
  readonly onPlay: (game: LibraryGameView) => void;
  readonly onQueryChange: (query: string) => void;
  readonly onSystems: () => void;
  readonly onViewChange: (view: ProductView) => void;
  readonly query: string;
  readonly selectedGame?: LibraryGameView;
  readonly view: ProductView;
}

const navigation: readonly { icon: IconName; key: ProductView }[] = [
  { icon: 'grid', key: 'library' },
  { icon: 'heart', key: 'favorites' },
  { icon: 'clock', key: 'recent' },
  { icon: 'settings', key: 'settings' },
];

export const LibraryShell = (props: LibraryShellProps): React.JSX.Element => (
  <main className="pc-shell">
    <div aria-hidden="true" className="pc-aurora" />
    <ParticleField />
    <aside className="pc-sidebar">
      <img alt="PixelCore" className="pc-logo" src={props.logoUrl} />
      <nav aria-label={props.copy.library}>
        <button className="pc-nav-button pc-systems-button" onClick={props.onSystems} type="button">
          <Icon name="gamepad" />
          <span>{props.copy.systems}</span>
        </button>
        {navigation.map(({ icon, key }) => (
          <button
            aria-current={props.view === key ? 'page' : undefined}
            className="pc-nav-button"
            key={key}
            onClick={() => props.onViewChange(key)}
            type="button"
          >
            <Icon name={icon} />
            <span>{props.copy[key === 'library' ? 'allGames' : key]}</span>
          </button>
        ))}
      </nav>
      <div className="pc-system-chip">
        <Icon name="gamepad" />
        <span>Game Boy</span>
        <i>{props.copy.ready}</i>
      </div>
    </aside>
    <section className="pc-content">
      <header className="pc-topbar">
        <div>
          <p className="pc-eyebrow">PixelCore · {props.copy.archive}</p>
          <h1>{props.copy[props.view === 'library' ? 'library' : props.view]}</h1>
        </div>
        <div className="pc-toolbar">
          <label className="pc-search">
            <Icon name="search" />
            <span className="pc-sr-only">{props.copy.search}</span>
            <input
              onChange={(event) => props.onQueryChange(event.target.value)}
              placeholder={props.copy.search}
              type="search"
              value={props.query}
            />
          </label>
          <button className="pc-primary-button" onClick={props.onAddGame} type="button">
            <Icon name="plus" /> {props.copy.addGame}
          </button>
        </div>
      </header>
      {props.view === 'settings' ? (
        <div className="pc-settings-page">
          <section className="pc-setting-card">
            <p className="pc-eyebrow">{props.copy.language}</p>
            <h2>{props.copy.interfaceLanguage}</h2>
            <select
              value={props.locale}
              onChange={(event) => props.onLocaleChange(event.target.value)}
            >
              <option value="en-US">English</option>
              <option value="pt-BR">Português (Brasil)</option>
              <option value="zh-CN">简体中文</option>
            </select>
          </section>
          {props.children}
        </div>
      ) : props.games.length === 0 ? (
        <div className="pc-empty-state" role="status">
          <span>
            <Icon name="archive" />
          </span>
          <h2>{props.copy.emptyTitle}</h2>
          <p>{props.copy.emptyBody}</p>
          <button className="pc-primary-button" onClick={props.onAddGame} type="button">
            {props.copy.emptyAction}
          </button>
        </div>
      ) : (
        <div className="pc-library-layout">
          <div className="pc-game-grid">
            {props.games.map((game, index) => (
              <article
                className="pc-game-card"
                key={game.id}
                style={{ '--delay': `${index * 45}ms` } as React.CSSProperties}
              >
                <button
                  className="pc-cover-button"
                  onClick={() => props.onPlay(game)}
                  type="button"
                >
                  <img alt="" src={props.artworkFor(game)} />
                  <span className="pc-play-orb">
                    <Icon name="gamepad" />
                  </span>
                </button>
                <div className="pc-card-copy">
                  <div>
                    <h2>{game.name}</h2>
                    <p>{game.extension.slice(1).toUpperCase()} · Game Boy</p>
                  </div>
                  <button
                    aria-label={`${props.copy.favorites}: ${game.name}`}
                    className={game.favorite ? 'pc-icon-button is-active' : 'pc-icon-button'}
                    onClick={() => props.onFavorite(game)}
                    type="button"
                  >
                    <Icon name="heart" />
                  </button>
                </div>
                <button
                  className="pc-artwork-link"
                  onClick={() => props.onArtwork(game)}
                  type="button"
                >
                  {props.copy.artwork}
                </button>
              </article>
            ))}
          </div>
          {props.selectedGame === undefined ? null : (
            <aside className="pc-now-card">
              <p className="pc-eyebrow">{props.copy.readyToPlay}</p>
              <img alt="" src={props.artworkFor(props.selectedGame)} />
              <h2>{props.selectedGame.name}</h2>
              <p>{props.copy.localPrivate}</p>
              <button
                className="pc-primary-button"
                onClick={() => props.onPlay(props.selectedGame!)}
                type="button"
              >
                <Icon name="gamepad" /> {props.copy.play}
              </button>
            </aside>
          )}
        </div>
      )}
    </section>
  </main>
);

export const ParticleField = (): React.JSX.Element => (
  <div aria-hidden="true" className="pc-particles">
    {Array.from({ length: 18 }, (_, index) => (
      <i key={index} />
    ))}
  </div>
);
