import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { ConsoleCatalogItem } from '@platform/ui-contracts';
import { InputPrompt } from './input-prompts.js';

export interface ConsoleCarouselCopy {
  readonly available: string;
  readonly chooseSystem: string;
  readonly comingSoon: string;
  readonly confirm: string;
  readonly formats: string;
  readonly next: string;
  readonly position: (current: number, total: number) => string;
  readonly previous: string;
  readonly unavailable: (name: string) => string;
}

export interface ConsoleCarouselHandle {
  confirm(): void;
  focus(): void;
  move(direction: 'left' | 'right'): void;
}

export interface ConsoleCarouselProps {
  readonly copy: ConsoleCarouselCopy;
  readonly items: readonly ConsoleCatalogItem[];
  readonly logoUrl: string;
  readonly onConfirm: (item: ConsoleCatalogItem) => void;
  readonly onFocusSound: () => void;
}

export const rotateCarouselIndex = (
  current: number,
  direction: 'left' | 'right',
  total: number,
): number => {
  if (total <= 0) return 0;
  return (current + (direction === 'right' ? 1 : -1) + total) % total;
};

export const ConsoleCarousel = forwardRef<ConsoleCarouselHandle, ConsoleCarouselProps>(
  function ConsoleCarousel(props, ref): React.JSX.Element {
    const [index, setIndex] = useState(0);
    const [direction, setDirection] = useState<'left' | 'right'>('right');
    const [outgoing, setOutgoing] = useState<ConsoleCatalogItem>();
    const [pressedDirection, setPressedDirection] = useState<'left' | 'right'>();
    const [announcement, setAnnouncement] = useState('');
    const touchStart = useRef<number | undefined>(undefined);
    const selection = useRef<HTMLButtonElement>(null);
    const transitionTimer = useRef<number | undefined>(undefined);
    const pressTimer = useRef<number | undefined>(undefined);
    const selected = props.items[index];

    const move = (nextDirection: 'left' | 'right'): void => {
      if (selected === undefined || props.items.length < 2) return;
      window.clearTimeout(transitionTimer.current);
      window.clearTimeout(pressTimer.current);
      setPressedDirection(nextDirection);
      pressTimer.current = window.setTimeout(() => setPressedDirection(undefined), 360);
      setOutgoing(selected);
      setDirection(nextDirection);
      const nextIndex = rotateCarouselIndex(index, nextDirection, props.items.length);
      const next = props.items[nextIndex];
      setIndex(nextIndex);
      if (next !== undefined)
        setAnnouncement(
          `${next.name}. ${next.availability === 'available' ? props.copy.available : props.copy.comingSoon}`,
        );
      props.onFocusSound();
      transitionTimer.current = window.setTimeout(() => setOutgoing(undefined), 560);
    };
    const confirm = (): void => {
      if (selected === undefined) return;
      if (selected.availability === 'coming-soon')
        setAnnouncement(props.copy.unavailable(selected.name));
      props.onConfirm(selected);
    };

    useImperativeHandle(ref, () => ({ confirm, focus: () => selection.current?.focus(), move }));
    useEffect(
      () => () => {
        window.clearTimeout(transitionTimer.current);
        window.clearTimeout(pressTimer.current);
      },
      [],
    );

    if (selected === undefined) return <main className="pc-console-home" />;
    const availabilityLabel =
      selected.availability === 'available' ? props.copy.available : props.copy.comingSoon;

    return (
      <main
        className="pc-console-home"
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault();
            move(event.key === 'ArrowLeft' ? 'left' : 'right');
          }
        }}
        style={{ '--pc-console-accent': selected.accentColor } as React.CSSProperties}
      >
        <div aria-hidden="true" className="pc-console-atmosphere">
          <i />
          <i />
          <i />
        </div>
        <div aria-live="polite" className="pc-sr-only">
          {announcement}
        </div>
        <header className="pc-console-header">
          <img alt="PixelCore" src={props.logoUrl} />
          <p>{props.copy.chooseSystem}</p>
        </header>
        <button
          aria-label={props.copy.previous}
          className={`pc-carousel-arrow pc-carousel-arrow-left${pressedDirection === 'left' ? ' is-pressed' : ''}`}
          onClick={() => move('left')}
          type="button"
        >
          <span aria-hidden="true" className="pc-arrow-energy">
            <i />
            <i />
            <i />
            <i />
          </span>
          <span aria-hidden="true" className="pc-arrow-glyph">
            ‹
          </span>
        </button>
        <section
          aria-label={selected.name}
          className="pc-console-stage"
          onPointerDown={(event) => {
            touchStart.current = event.clientX;
          }}
          onPointerUp={(event) => {
            const start = touchStart.current;
            touchStart.current = undefined;
            if (start === undefined || Math.abs(event.clientX - start) < 54) return;
            move(event.clientX < start ? 'right' : 'left');
          }}
        >
          <div aria-hidden="true" className="pc-atomic-orbits">
            <i>
              <span />
            </i>
            <i>
              <span />
            </i>
            <i>
              <span />
            </i>
          </div>
          <div aria-hidden="true" className="pc-hologram-platform" />
          {outgoing === undefined ? null : (
            <img
              alt=""
              className={`pc-console-artwork is-outgoing is-${direction}`}
              src={outgoing.artworkUrl}
            />
          )}
          <button
            aria-describedby="pc-console-meta"
            autoFocus
            className={`pc-console-selection is-entering-from-${direction}`}
            key={selected.id}
            onClick={confirm}
            ref={selection}
            type="button"
          >
            <img alt="" className="pc-console-artwork" src={selected.artworkUrl} />
            <span className="pc-console-action">
              <InputPrompt action="confirm" label={props.copy.confirm} />
              {props.copy.confirm}
            </span>
          </button>
        </section>
        <section className="pc-console-copy" id="pc-console-meta">
          <p className="pc-eyebrow">{selected.generation}</p>
          <h1>{selected.name}</h1>
          <div className="pc-console-meta-row">
            <span className={`pc-console-badge is-${selected.availability}`}>
              <i /> {availabilityLabel}
            </span>
            <span>
              {props.copy.formats}: {selected.extensions.join(' · ')}
            </span>
          </div>
        </section>
        <button
          aria-label={props.copy.next}
          className={`pc-carousel-arrow pc-carousel-arrow-right${pressedDirection === 'right' ? ' is-pressed' : ''}`}
          onClick={() => move('right')}
          type="button"
        >
          <span aria-hidden="true" className="pc-arrow-energy">
            <i />
            <i />
            <i />
            <i />
          </span>
          <span aria-hidden="true" className="pc-arrow-glyph">
            ›
          </span>
        </button>
        <footer className="pc-carousel-footer">
          <div aria-hidden="true" className="pc-carousel-dots">
            {props.items.map((item, itemIndex) => (
              <i className={itemIndex === index ? 'is-active' : ''} key={item.id} />
            ))}
          </div>
          <span>{props.copy.position(index + 1, props.items.length)}</span>
        </footer>
      </main>
    );
  },
);
