import { describe, expect, it } from 'vitest';
import {
  resolveOfficialConsoleAssetRoot,
  resolveOfficialConsolePlugin,
} from '@platform/official-plugins';
import { resolveConsoleAssets } from './console-asset-resolver.js';

describe('resolveConsoleAssets', () => {
  it('resolves plugin-owned GBA assets without exposing a filesystem path', async () => {
    const plugin = resolveOfficialConsolePlugin('org.pixelcore.game-boy-advance');
    const root = resolveOfficialConsoleAssetRoot('org.pixelcore.game-boy-advance');
    if (plugin?.console.assets === undefined || root === undefined)
      throw new Error('Fixture missing.');

    const assets = await resolveConsoleAssets(root, plugin.console.assets);

    expect(assets.consoleHeroUrl).toMatch(/^data:image\/png;base64,/);
    expect(assets.cartridgeUrl).toMatch(/^data:image\/webp;base64,/);
    expect(assets.cartridgeLabelMap).toEqual(plugin.console.assets.cartridgeLabelMap);
    expect(assets.blueprintUrl).toMatch(/^data:image\/png;base64,/);
    expect(assets.sessionBackdropUrl).toMatch(/^data:image\/png;base64,/);
    expect(assets.consoleHeroUrl).not.toContain('game-boy-advance');
  });

  it('rejects traversal and non-image asset references', async () => {
    await expect(
      resolveConsoleAssets(new URL('file:///tmp/assets/'), {
        consoleHero: 'assets/../secret.png',
      }),
    ).rejects.toThrow('Unsafe console asset reference');
    await expect(
      resolveConsoleAssets(new URL('file:///tmp/assets/'), {
        consoleHero: 'assets/%2e%2e/secret.png',
      }),
    ).rejects.toThrow('Unsafe console asset reference');
    await expect(
      resolveConsoleAssets(new URL('file:///tmp/assets/'), {
        consoleHero: 'assets/%5c%2e%2e%5csecret.png',
      }),
    ).rejects.toThrow('Unsafe console asset reference');
  });
});
