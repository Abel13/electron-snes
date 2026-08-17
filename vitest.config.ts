import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const baselinePath = fileURLToPath(new URL('./coverage-baseline.json', import.meta.url));
const baseline = existsSync(baselinePath)
  ? (JSON.parse(readFileSync(baselinePath, 'utf8')) as Record<string, number>)
  : undefined;

export default defineConfig({
  test: {
    coverage: {
      all: true,
      exclude: ['**/*.test.{ts,tsx}', '**/dist/**', '**/vendor/**'],
      include: [
        'apps/**/src/**/*.{ts,tsx}',
        'packages/**/src/**/*.{ts,tsx}',
        'plugins/**/src/**/*.{ts,tsx}',
      ],
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      ...(process.env.COVERAGE_BASELINE_MODE === 'update' || baseline === undefined
        ? {}
        : { thresholds: baseline }),
    },
    environment: 'node',
    passWithNoTests: true,
  },
});
