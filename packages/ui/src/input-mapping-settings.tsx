import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { CONTROL_DIAGRAM_CONSOLE_SLOTS, CONTROL_DIAGRAM_SYSTEM_SLOTS } from '@platform/shared';
import type { ControlDiagramConsoleSlot, ControlDiagramSlot } from '@platform/shared';

import { InputPrompt, InputPromptGroup, InputPromptProvider } from './input-prompts.js';
import type { InputPromptAction, InputPromptAssetMap, InputPromptScheme } from './input-prompts.js';

export interface ConsoleControlPoint {
  readonly action: string;
  readonly slot: ControlDiagramConsoleSlot;
  readonly x: number;
  readonly y: number;
}

export interface ConsoleControlDiagram {
  readonly alt: string;
  readonly aspectRatio?: number;
  readonly scale?: number;
  readonly assetUrl: string;
  readonly controlPoints: readonly ConsoleControlPoint[];
}

export interface InputMappingDeviceOption {
  readonly connected: boolean;
  readonly fingerprint: string;
  readonly label: string;
}

export interface InputMappingEntryOption {
  readonly consoleAction: string;
  readonly normalizedAction: string;
}

export interface KeyboardBindingOption {
  readonly code: string;
  readonly normalizedAction: string;
}

export interface AdvancedBindingOption {
  readonly command: string;
  readonly gamepadIndex: number;
  readonly keyboardCode: string;
  readonly label: string;
}

export interface InputMappingSettingsHandle {
  back(): boolean;
  captureGamepadInput(index: number): boolean;
  captureKeyboard(code: string, label: string): boolean;
  confirm(): void;
  move(direction: 'down' | 'left' | 'right' | 'up'): void;
}

type InputMappingStage =
  'button-navigation' | 'device-selection' | 'mapping-capture' | 'mapping-confirmation';

export interface InputMappingSettingsProps {
  readonly advancedBindings?: readonly AdvancedBindingOption[];
  readonly assetMap?: InputPromptAssetMap;
  readonly copy?: {
    readonly assigned: string;
    readonly advancedControls: string;
    readonly chooseDevice: string;
    readonly connected: string;
    readonly consoleAction: string;
    readonly disconnected: string;
    readonly editButton: string;
    readonly gameControls: string;
    readonly inputSettings: string;
    readonly mappingCancelled: string;
    readonly mappingCancel: string;
    readonly mappingConfirm: string;
    readonly mappingPreview: string;
    readonly mappingSaved: string;
    readonly pressInput: string;
    readonly playerOneDevice: string;
  };
  readonly devices: readonly InputMappingDeviceOption[];
  readonly diagram: ConsoleControlDiagram;
  readonly entries: readonly InputMappingEntryOption[];
  readonly keyboardBindings: readonly KeyboardBindingOption[];
  readonly onBackFeedback?: () => void;
  readonly onConfirmFeedback?: () => void;
  readonly onDeviceChange: (fingerprint: string) => void;
  readonly onEditFeedback?: () => void;
  readonly onKeyboardBindingChange: (normalizedAction: string, code: string) => void;
  readonly onGamepadBindingChange: (normalizedAction: string, index: number) => void;
  readonly onAdvancedGamepadBindingChange?: (command: string, index: number) => void;
  readonly onAdvancedKeyboardBindingChange?: (command: string, code: string) => void;
  readonly onNavigate?: () => void;
  readonly promptScheme: InputPromptScheme;
  readonly selectedDeviceFingerprint: string;
  readonly selectedDeviceKind: 'gamepad' | 'keyboard';
  readonly showDebugSlotGrid?: boolean;
}

const promptFor = (action: string): InputPromptAction => {
  if (action === 'primary' || action === 'secondary' || action === 'start' || action === 'select')
    return action;
  return 'navigate-all';
};

const actionLabel = (action: string): string =>
  action.replace('move-', '').replaceAll('-', ' ').toUpperCase();

const keyCodeLabel = (code: string): string =>
  code
    .replace(/^Key/, '')
    .replace(/^Digit/, '')
    .replace('Arrow', '');

interface ControlDiagramSlotPosition {
  readonly angle: number;
  readonly side: 'left' | 'right';
}

const consoleSlotPosition = (slot: ControlDiagramConsoleSlot): ControlDiagramSlotPosition => {
  const [side, indexText] = slot.split('-');
  const index = Number(indexText) - 1;
  const spacing = 112 / 11;
  return side === 'left'
    ? { angle: 316 - index * spacing, side: 'left' }
    : { angle: 44 + index * spacing, side: 'right' };
};

const slotPosition = (slot: ControlDiagramSlot): ControlDiagramSlotPosition => {
  if (slot === 'system-right-01') return { angle: 16, side: 'right' };
  if (slot === 'system-right-02') return { angle: 30, side: 'right' };
  return consoleSlotPosition(slot);
};

interface ControlDiagramConnector {
  readonly action: string;
  readonly endX: number;
  readonly endY: number;
  readonly startX: number;
  readonly startY: number;
}

const CONTROL_DIAGRAM_GRID_SLOTS: readonly ControlDiagramSlot[] = [
  ...CONTROL_DIAGRAM_CONSOLE_SLOTS,
  ...CONTROL_DIAGRAM_SYSTEM_SLOTS,
];

const slotLabel = (slot: ControlDiagramSlot): string => {
  if (slot === 'system-right-01') return 'S1';
  if (slot === 'system-right-02') return 'S2';
  const [side, index] = slot.split('-');
  return `${side === 'left' ? 'L' : 'R'}${index}`;
};

export const InputMappingSettings = forwardRef<
  InputMappingSettingsHandle,
  InputMappingSettingsProps
>(function InputMappingSettings(
  {
    assetMap,
    advancedBindings = [],
    copy = {
      assigned: 'Assigned',
      advancedControls: 'Advanced controls',
      chooseDevice: 'Choose a device, then confirm to configure its buttons.',
      connected: 'Connected',
      consoleAction: 'console action',
      disconnected: 'Disconnected device',
      editButton: 'Confirm to edit this button.',
      gameControls: 'Game controls',
      inputSettings: 'Input settings',
      mappingCancelled: 'Change cancelled.',
      mappingCancel: 'Cancel',
      mappingConfirm: 'Confirm',
      mappingPreview: 'Confirm this input or cancel.',
      mappingSaved: 'Mapping saved.',
      pressInput: 'Press a key or controller button.',
      playerOneDevice: 'Player one device',
    },
    devices,
    diagram,
    entries,
    keyboardBindings,
    onBackFeedback,
    onConfirmFeedback,
    onDeviceChange,
    onEditFeedback,
    onKeyboardBindingChange,
    onGamepadBindingChange,
    onAdvancedGamepadBindingChange,
    onAdvancedKeyboardBindingChange,
    onNavigate,
    promptScheme,
    selectedDeviceFingerprint,
    selectedDeviceKind,
    showDebugSlotGrid = false,
  },
  ref,
): React.JSX.Element {
  const displayDevices = useMemo(() => {
    if (
      selectedDeviceFingerprint === '' ||
      devices.some((device) => device.fingerprint === selectedDeviceFingerprint)
    )
      return devices;
    return [
      ...devices,
      {
        connected: false,
        fingerprint: selectedDeviceFingerprint,
        label: copy.disconnected,
      },
    ];
  }, [copy.disconnected, devices, selectedDeviceFingerprint]);
  const selectedDeviceIndex = Math.max(
    0,
    displayDevices.findIndex((device) => device.fingerprint === selectedDeviceFingerprint),
  );
  const [stage, setStage] = useState<InputMappingStage>('device-selection');
  const [deviceCursor, setDeviceCursor] = useState(selectedDeviceIndex);
  const [actionCursor, setActionCursor] = useState(0);
  const [capturedKeyboard, setCapturedKeyboard] = useState<{
    readonly code: string;
    readonly label: string;
  }>();
  const [capturedGamepadIndex, setCapturedGamepadIndex] = useState<number>();
  const [announcement, setAnnouncement] = useState(copy.chooseDevice);
  const [connectors, setConnectors] = useState<readonly ControlDiagramConnector[]>([]);
  const boardRef = useRef<HTMLDivElement>(null);
  const consoleFigureRef = useRef<HTMLDivElement>(null);
  const slotGridRefs = useRef(new Map<ControlDiagramSlot, HTMLElement>());
  const selectedEntry = entries[actionCursor];
  const selectedAdvanced = advancedBindings[actionCursor - entries.length];
  const selectedPoint = diagram.controlPoints.find(
    (point) => point.action === selectedEntry?.consoleAction,
  );

  useEffect(() => {
    if (stage === 'device-selection') setDeviceCursor(selectedDeviceIndex);
  }, [selectedDeviceIndex, stage]);

  useLayoutEffect(() => {
    const updateConnectors = (): void => {
      const board = boardRef.current;
      const figure = consoleFigureRef.current;
      if (board === null || figure === null) return;

      const boardRect = board.getBoundingClientRect();
      const figureRect = figure.getBoundingClientRect();
      if (boardRect.width === 0 || boardRect.height === 0 || figureRect.width === 0) return;

      const centerX = boardRect.width / 2;
      const centerY = boardRect.height / 2;
      const next = diagram.controlPoints.flatMap((point) => {
        const slot = slotGridRefs.current.get(point.slot);
        if (slot === undefined) return [];

        const slotRect = slot.getBoundingClientRect();
        const slotX = slotRect.left - boardRect.left + slotRect.width / 2;
        const slotY = slotRect.top - boardRect.top + slotRect.height / 2;
        const directionX = slotX - centerX;
        const directionY = slotY - centerY;
        const directionLength = Math.hypot(directionX, directionY);
        if (directionLength === 0) return [];

        const clearance = Math.max(slotRect.width, slotRect.height) / 2 + 8;
        return [
          {
            action: point.action,
            startX:
              ((figureRect.left - boardRect.left + (point.x / 100) * figureRect.width) /
                boardRect.width) *
              100,
            startY:
              ((figureRect.top - boardRect.top + (point.y / 100) * figureRect.height) /
                boardRect.height) *
              100,
            endX: ((slotX - (directionX / directionLength) * clearance) / boardRect.width) * 100,
            endY: ((slotY - (directionY / directionLength) * clearance) / boardRect.height) * 100,
          },
        ];
      });
      setConnectors(next);
    };

    updateConnectors();
    const observer =
      typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(updateConnectors);
    if (observer !== undefined) {
      if (boardRef.current !== null) observer.observe(boardRef.current);
      if (consoleFigureRef.current !== null) observer.observe(consoleFigureRef.current);
    }
    return () => observer?.disconnect();
  }, [diagram.controlPoints]);

  const move = (direction: 'down' | 'left' | 'right' | 'up'): void => {
    if (stage === 'device-selection') {
      if (direction !== 'up' && direction !== 'down') return;
      const next = Math.max(
        0,
        Math.min(displayDevices.length - 1, deviceCursor + (direction === 'down' ? 1 : -1)),
      );
      if (next === deviceCursor) return;
      setDeviceCursor(next);
      setAnnouncement(displayDevices[next]?.label ?? copy.chooseDevice);
      onNavigate?.();
      return;
    }
    if (stage === 'button-navigation') {
      if (direction !== 'up' && direction !== 'down') return;
      const next = Math.max(
        0,
        Math.min(
          entries.length + advancedBindings.length - 1,
          actionCursor + (direction === 'down' ? 1 : -1),
        ),
      );
      if (next === actionCursor) return;
      setActionCursor(next);
      setAnnouncement(
        entries[next] === undefined
          ? (advancedBindings[next - entries.length]?.label ?? '')
          : actionLabel(entries[next]?.normalizedAction ?? ''),
      );
      onNavigate?.();
      return;
    }
  };

  const confirm = (): void => {
    if (stage === 'device-selection') {
      const device = displayDevices[deviceCursor];
      if (device === undefined || !device.connected) return;
      if (device.fingerprint !== selectedDeviceFingerprint) onDeviceChange(device.fingerprint);
      setStage('button-navigation');
      setActionCursor(0);
      setAnnouncement(copy.editButton);
      onConfirmFeedback?.();
      return;
    }
    if (selectedEntry === undefined && selectedAdvanced === undefined) return;
    if (stage === 'button-navigation') {
      setCapturedKeyboard(undefined);
      setCapturedGamepadIndex(undefined);
      setStage('mapping-capture');
      setAnnouncement(copy.pressInput);
      onEditFeedback?.();
      return;
    }
    if (stage !== 'mapping-confirmation') return;
    if (capturedKeyboard !== undefined) {
      if (selectedAdvanced !== undefined)
        onAdvancedKeyboardBindingChange?.(selectedAdvanced.command, capturedKeyboard.code);
      else if (selectedEntry !== undefined)
        onKeyboardBindingChange(selectedEntry.normalizedAction, capturedKeyboard.code);
    } else if (capturedGamepadIndex !== undefined) {
      if (selectedAdvanced !== undefined)
        onAdvancedGamepadBindingChange?.(selectedAdvanced.command, capturedGamepadIndex);
      else if (selectedEntry !== undefined)
        onGamepadBindingChange(selectedEntry.normalizedAction, capturedGamepadIndex);
    } else return;
    setCapturedKeyboard(undefined);
    setCapturedGamepadIndex(undefined);
    setStage('button-navigation');
    setAnnouncement(copy.mappingSaved);
    onConfirmFeedback?.();
  };

  const back = (): boolean => {
    if (stage === 'mapping-capture' || stage === 'mapping-confirmation') {
      setCapturedKeyboard(undefined);
      setCapturedGamepadIndex(undefined);
      setStage('button-navigation');
      setAnnouncement(copy.mappingCancelled);
      onBackFeedback?.();
      return true;
    }
    if (stage === 'button-navigation') {
      setStage('device-selection');
      setAnnouncement(copy.chooseDevice);
      onBackFeedback?.();
      return true;
    }
    return false;
  };

  const captureGamepadInput = (index: number): boolean => {
    if (selectedDeviceKind !== 'gamepad') return false;
    if (index === 9) {
      if (stage === 'mapping-capture' || stage === 'mapping-confirmation') back();
      return true;
    }
    if (stage === 'mapping-capture') {
      setCapturedGamepadIndex(index);
      setStage('mapping-confirmation');
      setAnnouncement(`${copy.mappingPreview} B${index}`);
      return true;
    }
    if (stage !== 'mapping-confirmation') return false;
    if (index === 0) confirm();
    else if (index === 1) back();
    return true;
  };

  const captureKeyboard = (code: string, label: string): boolean => {
    if (selectedDeviceKind !== 'keyboard') return false;
    if (stage === 'mapping-capture') {
      setCapturedKeyboard({ code, label });
      setStage('mapping-confirmation');
      setAnnouncement(`${copy.mappingPreview} ${label}`);
      return true;
    }
    if (stage !== 'mapping-confirmation') return false;
    if (code === 'Enter') confirm();
    return true;
  };

  useImperativeHandle(ref, () => ({
    back,
    captureGamepadInput,
    captureKeyboard,
    confirm,
    move,
  }));

  const instructions =
    stage === 'device-selection'
      ? copy.chooseDevice
      : stage === 'button-navigation'
        ? copy.editButton
        : stage === 'mapping-capture'
          ? copy.pressInput
          : copy.mappingPreview;

  return (
    <InputPromptProvider {...(assetMap === undefined ? {} : { assetMap })} scheme={promptScheme}>
      <section
        aria-label={copy.inputSettings}
        autoFocus
        className={`pc-input-map is-${stage}`}
        onKeyDown={(event) => {
          if (stage === 'mapping-capture' || stage === 'mapping-confirmation') {
            if (event.key === 'Escape') {
              event.preventDefault();
              event.stopPropagation();
              back();
            } else if (
              stage === 'mapping-confirmation' &&
              selectedDeviceKind === 'keyboard' &&
              event.key === 'Enter'
            ) {
              event.preventDefault();
              event.stopPropagation();
              confirm();
            }
            return;
          }
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
          } else if (event.key === 'Enter') {
            event.preventDefault();
            event.stopPropagation();
            confirm();
          } else if (event.key === 'Escape' || event.key === 'Backspace') {
            if (!back()) return;
            event.preventDefault();
            event.stopPropagation();
          }
        }}
        tabIndex={-1}
      >
        <div aria-live="polite" className="pc-sr-only">
          {announcement}
        </div>
        <header className="pc-input-map-heading">
          <span>{copy.inputSettings}</span>
          <h1>{copy.gameControls}</h1>
          <p>{instructions}</p>
        </header>
        <div className="pc-input-map-layout">
          <aside aria-label={copy.playerOneDevice} className="pc-input-map-devices">
            {displayDevices.map((device, index) => (
              <button
                aria-current={device.fingerprint === selectedDeviceFingerprint ? 'true' : undefined}
                className={`${stage === 'device-selection' && index === deviceCursor ? 'is-focused ' : ''}${device.fingerprint === selectedDeviceFingerprint ? 'is-active' : ''}`}
                key={device.fingerprint}
                onClick={() => {
                  setDeviceCursor(index);
                  if (!device.connected) return;
                  if (device.fingerprint !== selectedDeviceFingerprint)
                    onDeviceChange(device.fingerprint);
                  setStage('button-navigation');
                  onConfirmFeedback?.();
                }}
                type="button"
              >
                <i aria-hidden="true" />
                <span>
                  <strong>{device.label}</strong>
                  <small>
                    {device.fingerprint === selectedDeviceFingerprint ? `${copy.assigned} · ` : ''}
                    {device.connected ? copy.connected : copy.disconnected}
                  </small>
                </span>
              </button>
            ))}
          </aside>

          <div className="pc-input-map-board" ref={boardRef}>
            <div
              aria-hidden="true"
              className={`pc-input-map-slot-grid${showDebugSlotGrid ? ' is-debug-visible' : ''}`}
            >
              {CONTROL_DIAGRAM_GRID_SLOTS.map((slot) => {
                const position = slotPosition(slot);
                return (
                  <i
                    className={`is-${position.side}${slot.startsWith('system-') ? ' is-system' : ''}`}
                    key={slot}
                    ref={(element) => {
                      if (element === null) slotGridRefs.current.delete(slot);
                      else slotGridRefs.current.set(slot, element);
                    }}
                    style={{ '--pc-callout-angle': `${position.angle}deg` } as React.CSSProperties}
                  >
                    {slotLabel(slot)}
                  </i>
                );
              })}
            </div>
            <svg
              aria-hidden="true"
              className="pc-input-map-lines"
              preserveAspectRatio="none"
              viewBox="0 0 100 100"
            >
              {connectors.map((connector) => {
                const index = entries.findIndex(
                  (entry) => entry.consoleAction === connector.action,
                );
                return (
                  <line
                    className={
                      stage !== 'device-selection' && actionCursor === index
                        ? 'is-active'
                        : undefined
                    }
                    key={connector.action}
                    x1={connector.startX}
                    x2={connector.endX}
                    y1={connector.startY}
                    y2={connector.endY}
                  />
                );
              })}
            </svg>
            <div className="pc-input-map-actions">
              {entries.map((entry, index) => {
                const active = stage !== 'device-selection' && actionCursor === index;
                const point = diagram.controlPoints.find(
                  (candidate) => candidate.action === entry.consoleAction,
                );
                if (point === undefined) return null;
                const position = slotPosition(point.slot);
                const displayedAction = entry.normalizedAction;
                const keyboardBinding = keyboardBindings.find(
                  (binding) => binding.normalizedAction === entry.normalizedAction,
                );
                const displayedKeyboardCode =
                  active && stage === 'mapping-confirmation' && capturedKeyboard !== undefined
                    ? capturedKeyboard.code
                    : keyboardBinding?.code;
                return (
                  <button
                    className={`is-callout-slot is-callout-${position.side} ${active ? 'is-focused' : ''}`}
                    key={entry.normalizedAction}
                    onClick={() => {
                      if (
                        stage === 'device-selection' ||
                        stage === 'mapping-capture' ||
                        stage === 'mapping-confirmation'
                      )
                        return;
                      if (actionCursor === index) confirm();
                      else setActionCursor(index);
                    }}
                    style={{ '--pc-callout-angle': `${position.angle}deg` } as React.CSSProperties}
                    type="button"
                  >
                    <span className="pc-input-map-badge">
                      {promptScheme === 'desktop' && displayedKeyboardCode !== undefined ? (
                        <span
                          className="pc-physical-key"
                          aria-label={keyCodeLabel(displayedKeyboardCode)}
                        >
                          {keyCodeLabel(displayedKeyboardCode)}
                        </span>
                      ) : (
                        <InputPrompt
                          action={promptFor(displayedAction)}
                          label={actionLabel(displayedAction)}
                        />
                      )}
                    </span>
                    <span>
                      <strong>{actionLabel(displayedAction)}</strong>
                      <small>{entry.consoleAction.toUpperCase()}</small>
                    </span>
                  </button>
                );
              })}
              {advancedBindings.length > 0 ? (
                <span className="pc-input-map-group-label">{copy.advancedControls}</span>
              ) : null}
              {advancedBindings.map((binding, offset) => {
                const slot = CONTROL_DIAGRAM_SYSTEM_SLOTS[offset];
                if (slot === undefined) return null;
                const index = entries.length + offset;
                const active = stage !== 'device-selection' && actionCursor === index;
                const position = slotPosition(slot);
                const displayedKeyboardCode =
                  active && stage === 'mapping-confirmation' && capturedKeyboard !== undefined
                    ? capturedKeyboard.code
                    : binding.keyboardCode;
                const displayedGamepadIndex =
                  active && stage === 'mapping-confirmation' && capturedGamepadIndex !== undefined
                    ? capturedGamepadIndex
                    : binding.gamepadIndex;
                return (
                  <button
                    className={`is-callout-slot is-callout-${position.side} ${active ? 'is-focused' : ''}`}
                    key={binding.command}
                    onClick={() => {
                      if (
                        stage === 'device-selection' ||
                        stage === 'mapping-capture' ||
                        stage === 'mapping-confirmation'
                      )
                        return;
                      if (actionCursor === index) confirm();
                      else setActionCursor(index);
                    }}
                    style={{ '--pc-callout-angle': `${position.angle}deg` } as React.CSSProperties}
                    type="button"
                  >
                    <span className="pc-input-map-badge">
                      <span className="pc-physical-key">
                        {selectedDeviceKind === 'keyboard'
                          ? keyCodeLabel(displayedKeyboardCode)
                          : `B${displayedGamepadIndex}`}
                      </span>
                    </span>
                    <span>
                      <strong>{binding.label}</strong>
                      <small>{copy.advancedControls}</small>
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="pc-input-map-console">
              <span className="pc-input-map-glow" />
              <div
                className="pc-input-map-console-figure"
                ref={consoleFigureRef}
                style={{
                  aspectRatio: diagram.aspectRatio ?? 2 / 3,
                  ...(diagram.scale === undefined
                    ? {}
                    : { height: `min(${62 * diagram.scale}vh, ${570 * diagram.scale}px)` }),
                }}
              >
                <img alt={diagram.alt} src={diagram.assetUrl} />
                {diagram.controlPoints.map((point) => (
                  <i
                    aria-hidden="true"
                    className={
                      stage !== 'device-selection' && selectedEntry?.consoleAction === point.action
                        ? 'is-active'
                        : undefined
                    }
                    key={point.action}
                    style={{ left: `${point.x}%`, top: `${point.y}%` }}
                  />
                ))}
                {(stage === 'mapping-capture' || stage === 'mapping-confirmation') &&
                selectedPoint !== undefined ? (
                  <div
                    className="pc-input-map-preview"
                    style={{ left: `${selectedPoint.x}%`, top: `${selectedPoint.y}%` }}
                  >
                    {capturedKeyboard === undefined && capturedGamepadIndex === undefined ? (
                      <strong>{copy.pressInput}</strong>
                    ) : (
                      <>
                        {capturedKeyboard !== undefined ? (
                          <span className="pc-physical-key">{capturedKeyboard.label}</span>
                        ) : (
                          <span className="pc-physical-key">B{capturedGamepadIndex}</span>
                        )}
                        <strong>{capturedKeyboard?.label ?? `B${capturedGamepadIndex}`}</strong>
                        <button onClick={confirm} type="button">
                          {copy.mappingConfirm}
                        </button>
                        <button onClick={back} type="button">
                          {copy.mappingCancel}
                        </button>
                      </>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
        <footer className="pc-input-map-footer">
          <span>{instructions}</span>
          <InputPromptGroup
            actions={
              stage === 'mapping-capture'
                ? ['back']
                : stage === 'mapping-confirmation'
                  ? ['confirm', 'back']
                  : ['navigate-vertical', 'confirm', 'back']
            }
            label={instructions}
          />
        </footer>
      </section>
    </InputPromptProvider>
  );
});
