import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react';

import { InputPrompt, InputPromptGroup, InputPromptProvider } from './input-prompts.js';
import type { InputPromptAction, InputPromptAssetMap, InputPromptScheme } from './input-prompts.js';

export interface ConsoleControlPoint {
  readonly action: string;
  readonly x: number;
  readonly y: number;
}

export interface ConsoleControlDiagram {
  readonly alt: string;
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

export interface InputMappingSettingsHandle {
  back(): boolean;
  captureGamepadInput(index: number): boolean;
  captureInput(action: string): boolean;
  captureKeyboard(code: string, label: string): boolean;
  confirm(): void;
  move(direction: 'down' | 'left' | 'right' | 'up'): void;
}

type InputMappingStage =
  'button-navigation' | 'device-selection' | 'mapping-capture' | 'mapping-confirmation';

export interface InputMappingSettingsProps {
  readonly assetMap?: InputPromptAssetMap;
  readonly copy?: {
    readonly assigned: string;
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
  readonly onMappingChange: (normalizedAction: string, consoleAction: string) => void;
  readonly onKeyboardBindingChange: (normalizedAction: string, code: string) => void;
  readonly onGamepadBindingChange: (normalizedAction: string, index: number) => void;
  readonly onNavigate?: () => void;
  readonly promptScheme: InputPromptScheme;
  readonly selectedDeviceFingerprint: string;
  readonly selectedDeviceKind: 'gamepad' | 'keyboard';
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

export const InputMappingSettings = forwardRef<
  InputMappingSettingsHandle,
  InputMappingSettingsProps
>(function InputMappingSettings(
  {
    assetMap,
    copy = {
      assigned: 'Assigned',
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
    onMappingChange,
    onKeyboardBindingChange,
    onGamepadBindingChange,
    onNavigate,
    promptScheme,
    selectedDeviceFingerprint,
    selectedDeviceKind,
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
  const [capturedAction, setCapturedAction] = useState<string>();
  const [capturedKeyboard, setCapturedKeyboard] = useState<{
    readonly code: string;
    readonly label: string;
  }>();
  const [capturedGamepadIndex, setCapturedGamepadIndex] = useState<number>();
  const [announcement, setAnnouncement] = useState(copy.chooseDevice);
  const selectedEntry = entries[actionCursor];
  const selectedPoint = diagram.controlPoints.find(
    (point) => point.action === selectedEntry?.consoleAction,
  );
  const capturedEntry = entries.find((entry) => entry.normalizedAction === capturedAction);

  useEffect(() => {
    if (stage === 'device-selection') setDeviceCursor(selectedDeviceIndex);
  }, [selectedDeviceIndex, stage]);

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
        Math.min(entries.length - 1, actionCursor + (direction === 'down' ? 1 : -1)),
      );
      if (next === actionCursor) return;
      setActionCursor(next);
      setAnnouncement(actionLabel(entries[next]?.normalizedAction ?? ''));
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
    if (selectedEntry === undefined) return;
    if (stage === 'button-navigation') {
      setCapturedAction(undefined);
      setCapturedKeyboard(undefined);
      setCapturedGamepadIndex(undefined);
      setStage('mapping-capture');
      setAnnouncement(copy.pressInput);
      onEditFeedback?.();
      return;
    }
    if (stage !== 'mapping-confirmation') return;
    if (capturedKeyboard !== undefined)
      onKeyboardBindingChange(selectedEntry.normalizedAction, capturedKeyboard.code);
    else if (capturedGamepadIndex !== undefined)
      onGamepadBindingChange(selectedEntry.normalizedAction, capturedGamepadIndex);
    else if (capturedAction !== undefined && capturedAction !== selectedEntry.normalizedAction)
      onMappingChange(capturedAction, selectedEntry.consoleAction);
    else if (capturedAction === undefined) return;
    setCapturedAction(undefined);
    setCapturedKeyboard(undefined);
    setCapturedGamepadIndex(undefined);
    setStage('button-navigation');
    setAnnouncement(copy.mappingSaved);
    onConfirmFeedback?.();
  };

  const back = (): boolean => {
    if (stage === 'mapping-capture' || stage === 'mapping-confirmation') {
      setCapturedAction(undefined);
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

  const captureInput = (action: string): boolean => {
    if (selectedDeviceKind !== 'gamepad') return false;
    if (stage === 'mapping-capture') {
      if (!entries.some((entry) => entry.normalizedAction === action)) return true;
      setCapturedAction(action);
      setStage('mapping-confirmation');
      setAnnouncement(`${copy.mappingPreview} ${actionLabel(action)}`);
      return true;
    }
    if (stage !== 'mapping-confirmation') return false;
    if (action === 'primary') confirm();
    else if (action === 'secondary') back();
    return true;
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
    captureInput,
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

          <div className="pc-input-map-board">
            <div className="pc-input-map-actions">
              {entries.map((entry, index) => {
                const active = stage !== 'device-selection' && actionCursor === index;
                const displayedAction =
                  active && stage === 'mapping-confirmation' && capturedEntry !== undefined
                    ? capturedEntry.normalizedAction
                    : entry.normalizedAction;
                const keyboardBinding = keyboardBindings.find(
                  (binding) => binding.normalizedAction === entry.normalizedAction,
                );
                const displayedKeyboardCode =
                  active && stage === 'mapping-confirmation' && capturedKeyboard !== undefined
                    ? capturedKeyboard.code
                    : keyboardBinding?.code;
                return (
                  <button
                    className={active ? 'is-focused' : undefined}
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
            </div>
            <div className="pc-input-map-console">
              <span className="pc-input-map-glow" />
              <div className="pc-input-map-console-figure">
                <svg
                  aria-hidden="true"
                  className="pc-input-map-lines"
                  preserveAspectRatio="none"
                  viewBox="-70 0 240 100"
                >
                  {entries.map((entry, index) => {
                    const point = diagram.controlPoints.find(
                      (candidate) => candidate.action === entry.consoleAction,
                    );
                    if (point === undefined) return null;
                    return (
                      <line
                        className={
                          stage !== 'device-selection' && actionCursor === index
                            ? 'is-active'
                            : undefined
                        }
                        key={entry.normalizedAction}
                        x1={index < 4 ? -90 : 180}
                        x2={point.x}
                        y1={20 + (index % 4) * 20}
                        y2={point.y}
                      />
                    );
                  })}
                </svg>
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
                    {capturedEntry === undefined &&
                    capturedKeyboard === undefined &&
                    capturedGamepadIndex === undefined ? (
                      <strong>{copy.pressInput}</strong>
                    ) : (
                      <>
                        {capturedKeyboard !== undefined ? (
                          <span className="pc-physical-key">{capturedKeyboard.label}</span>
                        ) : capturedGamepadIndex !== undefined ? (
                          <span className="pc-physical-key">B{capturedGamepadIndex}</span>
                        ) : capturedEntry !== undefined ? (
                          <InputPrompt
                            action={promptFor(capturedEntry.normalizedAction)}
                            label={actionLabel(capturedEntry.normalizedAction)}
                          />
                        ) : null}
                        <strong>
                          {capturedKeyboard?.label ??
                            (capturedGamepadIndex === undefined
                              ? capturedEntry === undefined
                                ? ''
                                : actionLabel(capturedEntry.normalizedAction)
                              : `B${capturedGamepadIndex}`)}
                        </strong>
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
