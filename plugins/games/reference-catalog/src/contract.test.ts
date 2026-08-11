import { expect, test } from 'vitest';
import { validatePluginContract } from '@platform/plugin-test';

import { referenceGameCatalog } from './index.js';

test('satisfies the public game metadata plugin contract', () => {
  expect(validatePluginContract(referenceGameCatalog)).toMatchObject({
    status: 'valid',
    type: 'game-metadata',
  });
});
