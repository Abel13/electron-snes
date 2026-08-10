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
  readonly devices: readonly InputMappingDeviceOption[];
  readonly entries: readonly InputMappingEntryOption[];
  readonly onDeviceChange: (fingerprint: string) => void;
  readonly onMappingChange: (normalizedAction: string, consoleAction: string) => void;
  readonly selectedDeviceFingerprint: string;
}

export const InputMappingSettings = ({
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
      <summary>Input settings</summary>
      <label>
        Player one device
        <select
          onChange={(event) => onDeviceChange(event.currentTarget.value)}
          value={selectedDeviceFingerprint}
        >
          {!selectedAvailable && selectedDeviceFingerprint !== '' ? (
            <option value={selectedDeviceFingerprint}>Disconnected device</option>
          ) : null}
          {devices.map((device) => (
            <option key={device.fingerprint} value={device.fingerprint}>
              {device.label}
              {device.connected ? '' : ' (disconnected)'}
            </option>
          ))}
        </select>
      </label>
      <fieldset>
        <legend>Game controls</legend>
        {entries.map((entry) => (
          <label key={entry.normalizedAction}>
            {entry.normalizedAction}
            <select
              aria-label={`${entry.normalizedAction} console action`}
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
