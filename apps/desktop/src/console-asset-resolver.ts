import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ConsoleAssetProfile } from '@platform/console-sdk';

export interface ResolvedConsoleAssets {
  readonly consoleHeroUrl: string;
  readonly cartridgeUrl?: string;
  readonly blueprintUrl?: string;
  readonly sessionBackdropUrl?: string;
  readonly cartridgeLabelMaskUrl?: string;
  readonly cartridgeLabelMap?: ConsoleAssetProfile['cartridgeLabelMap'];
  readonly controlDiagram?: ConsoleAssetProfile['controlDiagram'];
}

const MIME_TYPES: Readonly<Record<string, string>> = {
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

const readAsset = async (root: URL, relativePath: string): Promise<string> => {
  if (
    !relativePath.startsWith('assets/') ||
    relativePath.includes('..') ||
    relativePath.includes('\\')
  )
    throw new Error(`Unsafe console asset reference: ${relativePath}`);
  const assetUrl = new URL(relativePath.slice('assets/'.length), root);
  const mime = MIME_TYPES[extname(assetUrl.pathname).toLowerCase()];
  if (mime === undefined) throw new Error(`Unsupported console asset type: ${relativePath}`);
  const bytes = await readFile(fileURLToPath(assetUrl));
  return `data:${mime};base64,${bytes.toString('base64')}`;
};

export const resolveConsoleAssets = async (
  root: URL,
  profile: ConsoleAssetProfile,
): Promise<ResolvedConsoleAssets> => ({
  consoleHeroUrl: await readAsset(root, profile.consoleHero),
  ...(profile.cartridge === undefined
    ? {}
    : { cartridgeUrl: await readAsset(root, profile.cartridge) }),
  ...(profile.blueprint === undefined
    ? {}
    : { blueprintUrl: await readAsset(root, profile.blueprint) }),
  ...(profile.sessionBackdrop === undefined
    ? {}
    : { sessionBackdropUrl: await readAsset(root, profile.sessionBackdrop) }),
  ...(profile.cartridgeLabelMask === undefined
    ? {}
    : { cartridgeLabelMaskUrl: await readAsset(root, profile.cartridgeLabelMask) }),
  ...(profile.cartridgeLabelMap === undefined ? {} : { cartridgeLabelMap: profile.cartridgeLabelMap }),
  ...(profile.controlDiagram === undefined ? {} : { controlDiagram: profile.controlDiagram }),
});
