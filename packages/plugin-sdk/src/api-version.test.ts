import { expect, expectTypeOf, test } from 'vitest';

import {
  assessPluginApiCompatibility,
  CURRENT_PLUGIN_API_VERSION,
  DEFAULT_PLUGIN_API_SUPPORT_RANGE,
} from './api-version.js';
import type { PluginApiCompatibility, PluginApiSupportRange } from './api-version.js';

test('accepts the current plugin API version by default', () => {
  const compatibility = assessPluginApiCompatibility(CURRENT_PLUGIN_API_VERSION);

  expect(compatibility).toEqual({
    activation: 'eligible',
    declaredVersion: 1,
    status: 'compatible',
    supportedRange: DEFAULT_PLUGIN_API_SUPPORT_RANGE,
  });
  expectTypeOf(compatibility).toMatchTypeOf<PluginApiCompatibility>();
});

test('accepts inclusive compatibility range boundaries', () => {
  const supportedRange: PluginApiSupportRange = { maxInclusive: 2, minInclusive: 1 };

  expect(assessPluginApiCompatibility(1, supportedRange).status).toBe('compatible');
  expect(assessPluginApiCompatibility(2, supportedRange).status).toBe('compatible');
});

test('marks unsupported versions as inactive with a diagnostic', () => {
  const compatibility = assessPluginApiCompatibility(3, { maxInclusive: 2, minInclusive: 1 });

  expect(compatibility).toMatchObject({
    activation: 'inactive',
    diagnostic: { code: 'unsupported-plugin-api-version' },
    status: 'unsupported',
  });
});
