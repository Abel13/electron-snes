import { describe, expect, it } from 'vitest';
import { validateGameMetadataPlugin } from '@platform/game-sdk';
import { gameBoyAdvanceExampleCatalog } from './index.js';

describe('GBA example metadata catalog', () => {
  it('is valid and associates the legal fixture with GBA', () => {
    expect(validateGameMetadataPlugin(gameBoyAdvanceExampleCatalog)).toMatchObject({
      status: 'valid',
    });
    expect(gameBoyAdvanceExampleCatalog.metadata.records[0]?.consoleId).toBe(
      'org.pixelcore.game-boy-advance',
    );
  });
});
