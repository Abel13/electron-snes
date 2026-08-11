import type { BrowserWindow } from 'electron';
import updater from 'electron-updater';

import { UPDATE_EVENT_CHANNEL, type UpdateState } from './ipc.js';

const { autoUpdater } = updater;

export class DesktopUpdateService {
  private state: UpdateState;

  constructor(
    private readonly currentVersion: string,
    private readonly supported: boolean,
    private readonly getWindow: () => BrowserWindow | undefined,
  ) {
    this.state = { currentVersion, status: supported ? 'idle' : 'unsupported' };
    if (!supported) return;
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = false;
    autoUpdater.allowPrerelease = true;
    autoUpdater.on('checking-for-update', () =>
      this.setState({ currentVersion, status: 'checking' }),
    );
    autoUpdater.on('update-available', (info) =>
      this.setState({ currentVersion, status: 'available', version: info.version }),
    );
    autoUpdater.on('update-not-available', () =>
      this.setState({ currentVersion, status: 'not-available' }),
    );
    autoUpdater.on('download-progress', (progress) =>
      this.setState({
        currentVersion,
        percent: Math.max(0, Math.min(100, progress.percent)),
        status: 'downloading',
        version: 'version' in this.state ? this.state.version : currentVersion,
      }),
    );
    autoUpdater.on('update-downloaded', (info) =>
      this.setState({ currentVersion, status: 'downloaded', version: info.version }),
    );
    autoUpdater.on('error', (error) =>
      this.setState({ currentVersion, message: error.message, status: 'error' }),
    );
  }

  getState(): UpdateState {
    return this.state;
  }

  async check(): Promise<UpdateState> {
    if (!this.supported) return this.state;
    try {
      await autoUpdater.checkForUpdates();
    } catch (error) {
      this.setState({
        currentVersion: this.currentVersion,
        message: error instanceof Error ? error.message : 'Update check failed.',
        status: 'error',
      });
    }
    return this.state;
  }

  async download(): Promise<UpdateState> {
    if (!this.supported || this.state.status !== 'available') return this.state;
    await autoUpdater.downloadUpdate();
    return this.state;
  }

  install(): void {
    if (this.supported && this.state.status === 'downloaded')
      autoUpdater.quitAndInstall(false, true);
  }

  private setState(state: UpdateState): void {
    this.state = state;
    const window = this.getWindow();
    if (window !== undefined && !window.isDestroyed())
      window.webContents.send(UPDATE_EVENT_CHANNEL, state);
  }
}
