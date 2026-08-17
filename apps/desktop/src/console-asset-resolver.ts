import { readFile, realpath } from 'node:fs/promises';
import { extname, relative, resolve } from 'node:path';
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
  if (!relativePath.startsWith('assets/') || relativePath.includes('\\'))
    throw new Error(`Unsafe console asset reference: ${relativePath}`);
  let decodedPath: string;
  try {
    decodedPath = decodeURIComponent(relativePath);
  } catch {
    throw new Error(`Unsafe console asset reference: ${relativePath}`);
  }
  if (!decodedPath.startsWith('assets/'))
    throw new Error(`Unsafe console asset reference: ${relativePath}`);
  const rootPath = resolve(fileURLToPath(root));
  const unresolvedAssetPath = resolve(rootPath, decodedPath.slice('assets/'.length));
  const unresolvedPathFromRoot = relative(rootPath, unresolvedAssetPath);
  if (
    unresolvedPathFromRoot === '' ||
    unresolvedPathFromRoot.startsWith('..') ||
    unresolvedPathFromRoot.includes('../')
  )
    throw new Error(`Unsafe console asset reference: ${relativePath}`);
  const canonicalRootPath = await realpath(rootPath);
  const assetPath = await realpath(unresolvedAssetPath);
  const pathFromRoot = relative(canonicalRootPath, assetPath);
  if (pathFromRoot === '' || pathFromRoot.startsWith('..') || pathFromRoot.includes('../'))
    throw new Error(`Unsafe console asset reference: ${relativePath}`);
  const mime = MIME_TYPES[extname(assetPath).toLowerCase()];
  if (mime === undefined) throw new Error(`Unsupported console asset type: ${relativePath}`);
  const bytes = await readFile(assetPath);
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
  ...(profile.cartridgeLabelMap === undefined
    ? {}
    : { cartridgeLabelMap: profile.cartridgeLabelMap }),
  ...(profile.controlDiagram === undefined ? {} : { controlDiagram: profile.controlDiagram }),
});
