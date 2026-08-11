import { expect, test } from 'vitest';
import { validatePluginContract } from '@platform/plugin-test';

import { referenceHandheldConsole } from './index.js';

test('satisfies the public console plugin contract', () => {
  expect(validatePluginContract(referenceHandheldConsole)).toMatchObject({
    status: 'valid',
    type: 'console',
  });
});
