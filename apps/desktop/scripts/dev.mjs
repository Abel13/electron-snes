import { spawn } from 'node:child_process';
import { watch } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';

const root = new URL('..', import.meta.url).pathname;
const devServerUrl = 'http://127.0.0.1:5173';
const children = new Set();
let electron;
let restartTimer;
let restartingElectron = false;
let shuttingDown = false;

const run = (command, args, options = {}) => {
  const child = spawn(command, args, {
    cwd: root,
    env: process.env,
    stdio: 'inherit',
    ...options,
  });
  children.add(child);
  child.once('exit', (code) => {
    children.delete(child);
    if (!shuttingDown && code !== 0 && code !== null) shutdown(code);
  });
  return child;
};

const buildWorkspace = (filters) =>
  new Promise((resolve, reject) => {
    const child = spawn('pnpm', [...filters, 'build'], {
      cwd: new URL('../../..', import.meta.url).pathname,
      env: process.env,
      stdio: 'inherit',
    });
    child.once('error', reject);
    child.once('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Workspace build failed with exit code ${code ?? 'unknown'}.`));
    });
  });

const buildOfficialConsolePlugins = async () => {
  await buildWorkspace(['--filter', '@platform/official-plugins...']);
  await buildWorkspace(['--filter', '@platform/ui']);
};

const startElectron = () => {
  const { ELECTRON_RUN_AS_NODE: _ignored, ...environment } = process.env;
  electron = run('pnpm', ['exec', 'electron', '.'], {
    env: { ...environment, PIXELCORE_DEV_SERVER_URL: devServerUrl },
  });
};

const restartElectron = () => {
  clearTimeout(restartTimer);
  restartTimer = setTimeout(() => {
    if (restartingElectron) return;
    if (electron === undefined || electron.exitCode !== null) {
      startElectron();
      return;
    }
    restartingElectron = true;
    electron.once('exit', () => {
      restartingElectron = false;
      if (!shuttingDown) startElectron();
    });
    electron.kill('SIGTERM');
  }, 150);
};

const shutdown = (code = 0) => {
  if (shuttingDown) return;
  shuttingDown = true;
  clearTimeout(restartTimer);
  for (const child of children) child.kill('SIGTERM');
  setTimeout(() => process.exit(code), 100);
};

process.once('SIGINT', () => shutdown());
process.once('SIGTERM', () => shutdown());

await buildOfficialConsolePlugins();

run('pnpm', ['exec', 'vite']);
run('pnpm', ['exec', 'vite', 'build', '--watch', '--config', 'vite.preload.config.ts']);
run('pnpm', ['exec', 'tsc', '-p', 'tsconfig.build.json', '--watch', '--preserveWatchOutput']);
run('pnpm', [
  '--filter',
  '@platform/ui',
  'exec',
  'tsc',
  '-p',
  'tsconfig.build.json',
  '--watch',
  '--preserveWatchOutput',
]);
run('pnpm', [
  '--filter',
  '@platform/input',
  'exec',
  'tsc',
  '-p',
  'tsconfig.build.json',
  '--watch',
  '--preserveWatchOutput',
]);

await new Promise((resolve) => setTimeout(resolve, 1500));

startElectron();

for (const file of ['main.js', 'preload.cjs']) {
  watch(join(root, 'dist', file), restartElectron);
}
