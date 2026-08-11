import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { InputPrompt, InputPromptGroup } from './input-prompts.js';

export interface GlobalSettingsLocaleOption {
  readonly label: string;
  readonly value: string;
}

export interface GlobalSettingsMenuCopy {
  readonly adjustHint: string;
  readonly close: string;
  readonly closeHint: string;
  readonly confirmHint: string;
  readonly exit: string;
  readonly language: string;
  readonly muted: string;
  readonly moveHint: string;
  readonly sounds: string;
  readonly soundsOn: string;
  readonly title: string;
  readonly updates: string;
  readonly volume: string;
}

export interface GlobalSettingsMenuHandle {
  back(): void;
  confirm(): void;
  focus(): void;
  move(direction: 'down' | 'left' | 'right' | 'up'): void;
}

export interface GlobalSettingsMenuProps {
  readonly copy: GlobalSettingsMenuCopy;
  readonly locale: string;
  readonly locales: readonly GlobalSettingsLocaleOption[];
  readonly muted: boolean;
  readonly onAdjust: () => void;
  readonly onClose: () => void;
  readonly onLocaleChange: (locale: string) => void;
  readonly onExit: () => void;
  readonly onMutedChange: (muted: boolean) => void;
  readonly onUpdate: () => void;
  readonly onNavigate: () => void;
  readonly onVolumeChange: (volume: number) => void;
  readonly volume: number;
  readonly updateValue: string;
}

export const moveSettingsIndex = (current: number, direction: 'down' | 'up'): number =>
  Math.max(0, Math.min(4, current + (direction === 'down' ? 1 : -1)));

export const cycleSettingsOption = (
  current: number,
  direction: 'left' | 'right',
  total: number,
): number => (total <= 0 ? 0 : (current + (direction === 'right' ? 1 : -1) + total) % total);

export const adjustSettingsVolume = (volume: number, direction: 'left' | 'right'): number =>
  Math.max(
    0,
    Math.min(1, Math.round((volume + (direction === 'right' ? 0.05 : -0.05)) * 100) / 100),
  );

export const GlobalSettingsMenu = forwardRef<GlobalSettingsMenuHandle, GlobalSettingsMenuProps>(
  function GlobalSettingsMenu(props, ref): React.JSX.Element {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [announcement, setAnnouncement] = useState('');
    const container = useRef<HTMLElement>(null);

    const valueAt = (index: number): string => {
      if (index === 0)
        return props.locales.find((locale) => locale.value === props.locale)?.label ?? props.locale;
      if (index === 1) return props.muted ? props.copy.muted : props.copy.soundsOn;
      if (index === 2) return `${Math.round(props.volume * 100)}%`;
      if (index === 3) return props.updateValue;
      return props.copy.exit;
    };
    const select = (index: number): void => {
      if (index === selectedIndex) return;
      setSelectedIndex(index);
      setAnnouncement(
        `${[props.copy.language, props.copy.sounds, props.copy.volume, props.copy.updates, props.copy.exit][index]}. ${valueAt(index)}`,
      );
      props.onNavigate();
    };
    const adjust = (direction: 'left' | 'right'): void => {
      if (selectedIndex >= 3) return;
      if (selectedIndex === 0) {
        const current = Math.max(
          0,
          props.locales.findIndex((item) => item.value === props.locale),
        );
        const next = props.locales[cycleSettingsOption(current, direction, props.locales.length)];
        if (next !== undefined) props.onLocaleChange(next.value);
      } else if (selectedIndex === 1) props.onMutedChange(!props.muted);
      else props.onVolumeChange(adjustSettingsVolume(props.volume, direction));
      props.onAdjust();
    };
    const move = (direction: 'down' | 'left' | 'right' | 'up'): void => {
      if (direction === 'up' || direction === 'down')
        select(moveSettingsIndex(selectedIndex, direction));
      else adjust(direction);
    };
    const confirm = (): void => {
      if (selectedIndex === 3) props.onUpdate();
      else if (selectedIndex === 4) props.onExit();
      else adjust('right');
    };

    useImperativeHandle(ref, () => ({
      back: props.onClose,
      confirm,
      focus: () => container.current?.focus(),
      move,
    }));

    const rows = [
      { label: props.copy.language, value: valueAt(0) },
      { label: props.copy.sounds, value: valueAt(1) },
      { label: props.copy.volume, value: valueAt(2) },
      { label: props.copy.updates, value: valueAt(3) },
      { label: props.copy.exit, value: '' },
    ];

    return (
      <>
        <div aria-hidden="true" className="pc-global-settings-backdrop" onClick={props.onClose} />
        <aside
          aria-label={props.copy.title}
          aria-modal="true"
          autoFocus
          className="pc-global-settings"
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
            } else if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              event.stopPropagation();
              confirm();
            } else if (event.key === 'Escape' || event.key === 'Backspace') {
              event.preventDefault();
              event.stopPropagation();
              props.onClose();
            }
          }}
          ref={container}
          role="dialog"
          tabIndex={-1}
        >
          <div aria-live="polite" className="pc-sr-only">
            {announcement}
          </div>
          <header>
            <div>
              <span>PixelCore</span>
              <h2>{props.copy.title}</h2>
            </div>
            <button aria-label={props.copy.close} onClick={props.onClose} type="button">
              ×
            </button>
          </header>
          <div className="pc-settings-menu">
            {rows.map((row, index) => (
              <button
                aria-current={selectedIndex === index ? 'true' : undefined}
                className={`${selectedIndex === index ? 'is-selected' : ''}${index >= 3 ? ' is-action' : ''}`}
                key={row.label}
                onClick={() => (selectedIndex === index ? confirm() : select(index))}
                type="button"
              >
                <span>{row.label}</span>
                <strong>
                  {index >= 3 ? null : <i aria-hidden="true">‹</i>}
                  {index === 4 ? row.label : row.value}
                  {index >= 3 ? null : <i aria-hidden="true">›</i>}
                </strong>
                {index === 2 ? (
                  <em
                    style={
                      { '--pc-setting-level': `${props.volume * 100}%` } as React.CSSProperties
                    }
                  />
                ) : null}
              </button>
            ))}
          </div>
          <footer>
            <span>
              <InputPrompt action="navigate-vertical" label={props.copy.moveHint} />
              {props.copy.moveHint}
            </span>
            <span>
              <InputPrompt action="navigate-horizontal" label={props.copy.adjustHint} />
              {props.copy.adjustHint}
            </span>
            <span>
              <InputPrompt action="confirm" label={props.copy.confirmHint} />
              {props.copy.confirmHint}
            </span>
            <span>
              <InputPromptGroup actions={['back', 'start']} label={props.copy.closeHint} />
              {props.copy.closeHint}
            </span>
          </footer>
        </aside>
      </>
    );
  },
);
