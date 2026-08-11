import {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import type { InputMappingSettingsHandle } from './input-mapping-settings.js';
import type { ConsoleCatalogItem } from '@platform/ui-contracts';
import { Icon } from './icons.js';
import { InputPrompt } from './input-prompts.js';
import type { LibraryGameView } from './product-shell.js';

export type ConsoleLibraryCategory = 'library' | 'favorites' | 'recent' | 'settings';

export interface ConsoleLibraryCopy {
  readonly addGame: string;
  readonly artwork: string;
  readonly backSystems: string;
  readonly emptyCategory: string;
  readonly favorite: string;
  readonly favorites: string;
  readonly library: string;
  readonly playHint: string;
  readonly recent: string;
  readonly removeFavorite: string;
  readonly settings: string;
}

export interface ConsoleLibraryHandle {
  back(): void;
  confirm(): void;
  move(direction: 'down' | 'left' | 'right' | 'up'): void;
}

export interface ConsoleLibraryProps {
  readonly artworkFor: (game: LibraryGameView) => string;
  readonly cartridgeUrl: string;
  readonly children?: ReactNode;
  readonly console: ConsoleCatalogItem;
  readonly copy: ConsoleLibraryCopy;
  readonly games: readonly LibraryGameView[];
  readonly logoUrl: string;
  readonly onAddGame: () => void;
  readonly onArtwork: (game: LibraryGameView) => void;
  readonly onBack: () => void;
  readonly onBackFeedback: () => void;
  readonly onCategoryChange: () => void;
  readonly onDetail: () => void;
  readonly onFavorite: (game: LibraryGameView) => void;
  readonly onPlay: (game: LibraryGameView) => void;
  readonly onSelect: (game: LibraryGameView) => void;
  readonly onSelectionChange: () => void;
  readonly settingsRef?: RefObject<InputMappingSettingsHandle | null>;
}

const categories: readonly ConsoleLibraryCategory[] = [
  'library',
  'favorites',
  'recent',
  'settings',
];

export const moveCategoryIndex = (current: number, direction: 'down' | 'up'): number =>
  Math.max(0, Math.min(categories.length - 1, current + (direction === 'down' ? 1 : -1)));

export const moveGameIndex = (
  current: number,
  direction: 'left' | 'right',
  total: number,
): number => {
  if (total <= 0) return 0;
  const next = current + (direction === 'right' ? 1 : -1);
  return Math.max(0, Math.min(total - 1, next));
};

export const moveGameOffset = (current: number, offset: number, total: number): number => {
  if (total <= 0) return 0;
  return Math.max(0, Math.min(total - 1, current + offset));
};

export interface CarouselSlot {
  readonly game: LibraryGameView;
  readonly offset: number;
}

export const getCarouselSlots = (
  games: readonly LibraryGameView[],
  selectedIndex: number,
): readonly CarouselSlot[] => {
  const seen = new Set<string>();
  const slots: CarouselSlot[] = [];
  for (const offset of [0, -1, 1, -2, 2]) {
    const raw = selectedIndex + offset;
    if (raw < 0 || raw >= games.length) continue;
    const game = games[raw];
    if (game === undefined || seen.has(game.id)) continue;
    seen.add(game.id);
    slots.push({ game, offset });
  }
  return slots.sort((left, right) => left.offset - right.offset);
};

const Cartridge = (props: {
  readonly artworkUrl: string;
  readonly cartridgeUrl: string;
}): React.JSX.Element => (
  <span className="pc-cartridge">
    <img alt="" className="pc-cartridge-shell" src={props.cartridgeUrl} />
    <img alt="" className="pc-cartridge-label" src={props.artworkUrl} />
  </span>
);

export const ConsoleLibrary = forwardRef<ConsoleLibraryHandle, ConsoleLibraryProps>(
  function ConsoleLibrary(props, ref): React.JSX.Element {
    const [categoryIndex, setCategoryIndex] = useState(0);
    const [selectionByCategory, setSelectionByCategory] = useState<Record<string, number>>({});
    const [detailedGameId, setDetailedGameId] = useState<string>();
    const [announcement, setAnnouncement] = useState('');
    const pointerStart = useRef<number | undefined>(undefined);
    const category = categories[categoryIndex] ?? 'library';
    const categoryGames = useMemo(() => {
      if (category === 'favorites') return props.games.filter((game) => game.favorite);
      if (category === 'recent')
        return [...props.games]
          .filter((game) => game.lastPlayedAt !== undefined)
          .sort((left, right) => (right.lastPlayedAt ?? '').localeCompare(left.lastPlayedAt ?? ''));
      return category === 'library' ? props.games : [];
    }, [category, props.games]);
    const selectedIndex = Math.min(
      selectionByCategory[category] ?? 0,
      Math.max(0, categoryGames.length - 1),
    );
    const selectedGame = categoryGames[selectedIndex];
    const slots = getCarouselSlots(categoryGames, selectedIndex);
    const categoryName = props.copy[category];

    const selectIndex = (nextIndex: number): void => {
      const next = categoryGames[nextIndex];
      if (next === undefined) return;
      setSelectionByCategory((current) => ({ ...current, [category]: nextIndex }));
      setDetailedGameId(undefined);
      setAnnouncement(`${categoryName}. ${next.name}. ${nextIndex + 1} / ${categoryGames.length}`);
      props.onSelect(next);
      props.onSelectionChange();
    };
    const move = (direction: 'down' | 'left' | 'right' | 'up'): void => {
      if (category === 'settings') {
        props.settingsRef?.current?.move(direction);
        return;
      }
      if (direction === 'up' || direction === 'down') {
        const nextCategoryIndex = moveCategoryIndex(categoryIndex, direction);
        if (nextCategoryIndex === categoryIndex) return;
        setCategoryIndex(nextCategoryIndex);
        setDetailedGameId(undefined);
        const nextCategory = categories[nextCategoryIndex] ?? 'library';
        setAnnouncement(props.copy[nextCategory]);
        props.onCategoryChange();
        return;
      }
      if (categoryGames.length === 0) return;
      const nextIndex = moveGameIndex(selectedIndex, direction, categoryGames.length);
      if (nextIndex !== selectedIndex) selectIndex(nextIndex);
    };
    const confirm = (): void => {
      if (category === 'settings') {
        props.settingsRef?.current?.confirm();
        return;
      }
      if (selectedGame === undefined) return;
      if (detailedGameId !== selectedGame.id) {
        setDetailedGameId(selectedGame.id);
        setAnnouncement(`${selectedGame.name}. ${props.copy.playHint}`);
        props.onDetail();
      } else props.onPlay(selectedGame);
    };
    const back = (): void => {
      if (category === 'settings') {
        if (props.settingsRef?.current?.back()) return;
        const nextCategoryIndex = Math.max(0, categoryIndex - 1);
        setCategoryIndex(nextCategoryIndex);
        setAnnouncement(props.copy[categories[nextCategoryIndex] ?? 'library']);
        props.onCategoryChange();
        return;
      }
      if (detailedGameId !== undefined) {
        setDetailedGameId(undefined);
        props.onBackFeedback();
      } else props.onBack();
    };

    useImperativeHandle(ref, () => ({ back, confirm, move }));
    const previousCategory = categories[categoryIndex - 1];
    const nextCategory = categories[categoryIndex + 1];

    return (
      <main
        autoFocus
        className="pc-console-library"
        onKeyDown={(event) => {
          const direction = {
            ArrowDown: 'down',
            ArrowLeft: 'left',
            ArrowRight: 'right',
            ArrowUp: 'up',
          }[event.key] as 'down' | 'left' | 'right' | 'up' | undefined;
          if (direction !== undefined) {
            event.preventDefault();
            event.stopPropagation();
            move(direction);
          } else if (event.key === 'Escape' || event.key === 'Backspace') {
            event.preventDefault();
            back();
          }
        }}
        style={{ '--pc-console-accent': props.console.accentColor } as React.CSSProperties}
        tabIndex={-1}
      >
        <div aria-hidden="true" className="pc-library-atmosphere" />
        <div aria-live="polite" className="pc-sr-only">
          {announcement}
        </div>
        <header className="pc-console-library-header">
          <button className="pc-console-back" onClick={back} type="button">
            <span aria-hidden="true">‹</span> {props.copy.backSystems}
          </button>
          <img alt="PixelCore" src={props.logoUrl} />
          <div>
            <p>{props.console.name}</p>
            <span>{props.console.extensions.join(' · ')}</span>
          </div>
          <button className="pc-add-rom" onClick={props.onAddGame} type="button">
            <Icon name="plus" /> {props.copy.addGame}
          </button>
        </header>
        <nav aria-label={categoryName} className="pc-category-rail">
          <span>{previousCategory === undefined ? '' : props.copy[previousCategory]}</span>
          <strong>{categoryName}</strong>
          <span>{nextCategory === undefined ? '' : props.copy[nextCategory]}</span>
        </nav>
        <section
          className="pc-console-library-stage"
          onPointerDown={(event) => {
            pointerStart.current = event.clientX;
          }}
          onPointerUp={(event) => {
            const start = pointerStart.current;
            pointerStart.current = undefined;
            if (start !== undefined && Math.abs(event.clientX - start) >= 50)
              move(event.clientX < start ? 'right' : 'left');
          }}
        >
          {category === 'settings' ? (
            <div className="pc-console-controls">{props.children}</div>
          ) : categoryGames.length === 0 ? (
            <div className="pc-console-empty" role="status">
              <Icon name={category === 'favorites' ? 'heart' : 'clock'} />
              <h1>{categoryName}</h1>
              <p>{props.copy.emptyCategory}</p>
            </div>
          ) : (
            <div className="pc-cartridge-carousel">
              {slots.map(({ game, offset }) => (
                <button
                  aria-label={game.name}
                  className={`pc-cartridge-slot is-offset-${offset < 0 ? `n${Math.abs(offset)}` : offset}${offset === 0 && detailedGameId === game.id ? ' is-detailed' : ''}`}
                  key={game.id}
                  onClick={() => {
                    if (offset === 0) confirm();
                    else selectIndex(moveGameOffset(selectedIndex, offset, categoryGames.length));
                  }}
                  type="button"
                >
                  <Cartridge
                    artworkUrl={props.artworkFor(game)}
                    cartridgeUrl={props.cartridgeUrl}
                  />
                </button>
              ))}
              {selectedGame === undefined ? null : (
                <div
                  className={
                    detailedGameId === selectedGame.id ? 'pc-game-focus is-open' : 'pc-game-focus'
                  }
                >
                  <h1>{selectedGame.name}</h1>
                  <p>{props.copy.playHint}</p>
                  <div>
                    <button onClick={() => props.onFavorite(selectedGame)} type="button">
                      <Icon name="heart" />{' '}
                      {selectedGame.favorite ? props.copy.removeFavorite : props.copy.favorite}
                    </button>
                    <button onClick={() => props.onArtwork(selectedGame)} type="button">
                      {props.copy.artwork}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
        <footer className="pc-console-library-footer">
          <span>
            <InputPrompt action="navigate-vertical" label={categoryName} /> {categoryName}
          </span>
          <span>
            <InputPrompt
              action="navigate-horizontal"
              label={selectedGame?.name ?? props.console.name}
            />{' '}
            {selectedGame?.name ?? props.console.name}
          </span>
          <span>
            {selectedGame === undefined ? '' : `${selectedIndex + 1} / ${categoryGames.length}`}
          </span>
        </footer>
      </main>
    );
  },
);
