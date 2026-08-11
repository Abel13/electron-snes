import { expect, test } from 'vitest';
import { validatePluginContract } from '@platform/plugin-test';

import { referenceGamepad } from './index.js';

test('satisfies the public controller plugin contract', () => {
  expect(validatePluginContract(referenceGamepad)).toMatchObject({
    status: 'valid',
    type: 'controller',
  });
});
