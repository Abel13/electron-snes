import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const rootDirectory = fileURLToPath(new URL('..', import.meta.url));
const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const result = spawnSync(pnpm, ['exec', 'vitest', 'run', '--coverage'], {
  cwd: rootDirectory,
  env: { ...process.env, COVERAGE_BASELINE_MODE: 'update' },
  stdio: 'inherit',
});

if (result.status !== 0) process.exit(result.status ?? 1);

const summaryPath = new URL('../coverage/coverage-summary.json', import.meta.url);
const baselinePath = new URL('../coverage-baseline.json', import.meta.url);
const summary = JSON.parse(await readFile(summaryPath, 'utf8'));
const metrics = ['branches', 'functions', 'lines', 'statements'];
const baseline = Object.fromEntries(
  metrics.map((metric) => {
    const percentage = summary.total?.[metric]?.pct;
    if (typeof percentage !== 'number' || !Number.isFinite(percentage))
      throw new Error(`Coverage did not report a valid ${metric} percentage.`);
    return [metric, percentage];
  }),
);

await writeFile(baselinePath, `${JSON.stringify(baseline, null, 2)}\n`);
