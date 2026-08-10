export interface InputMappingDeviceOption {
  readonly connected: boolean;
  readonly fingerprint: string;
  readonly label: string;
}

export interface InputMappingEntryOption {
  readonly consoleAction: string;
  readonly normalizedAction: string;
}

export interface InputMappingSettingsProps {
  readonly copy?: {
    readonly consoleAction: string;
    readonly disconnected: string;
    readonly gameControls: string;
    readonly inputSettings: string;
    readonly playerOneDevice: string;
  };
  readonly devices: readonly InputMappingDeviceOption[];
  readonly entries: readonly InputMappingEntryOption[];
  readonly onDeviceChange: (fingerprint: string) => void;
  readonly onMappingChange: (normalizedAction: string, consoleAction: string) => void;
  readonly selectedDeviceFingerprint: string;
}

export const InputMappingSettings = ({
  copy = {
    consoleAction: 'console action',
    disconnected: 'Disconnected device',
    gameControls: 'Game controls',
    inputSettings: 'Input settings',
    playerOneDevice: 'Player one device',
  },
  devices,
  entries,
  onDeviceChange,
  onMappingChange,
  selectedDeviceFingerprint,
}: InputMappingSettingsProps): React.JSX.Element => {
  const selectedAvailable = devices.some(
    (device) => device.fingerprint === selectedDeviceFingerprint,
  );
  return (
    <details className="pixelcore-input-settings">
      <summary>{copy.inputSettings}</summary>
      <label>
        {copy.playerOneDevice}
        <select
          onChange={(event) => onDeviceChange(event.currentTarget.value)}
          value={selectedDeviceFingerprint}
        >
          {!selectedAvailable && selectedDeviceFingerprint !== '' ? (
            <option value={selectedDeviceFingerprint}>{copy.disconnected}</option>
          ) : null}
          {devices.map((device) => (
            <option key={device.fingerprint} value={device.fingerprint}>
              {device.label}
              {device.connected ? '' : ` (${copy.disconnected})`}
            </option>
          ))}
        </select>
      </label>
      <fieldset>
        <legend>{copy.gameControls}</legend>
        {entries.map((entry) => (
          <label key={entry.normalizedAction}>
            {entry.normalizedAction}
            <select
              aria-label={`${entry.normalizedAction} ${copy.consoleAction}`}
              onChange={(event) =>
                onMappingChange(entry.normalizedAction, event.currentTarget.value)
              }
              value={entry.consoleAction}
            >
              {entries.map((option) => (
                <option key={option.consoleAction} value={option.consoleAction}>
                  {option.consoleAction}
                </option>
              ))}
            </select>
          </label>
        ))}
      </fieldset>
    </details>
  );
};
