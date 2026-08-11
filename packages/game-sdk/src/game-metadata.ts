import { PluginManifestSchema } from '@platform/plugin-sdk';
import type { PluginManifest } from '@platform/plugin-sdk';

const IDENTIFIER_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const PLUGIN_ID_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/;
const LOCALE_PATTERN = /^[a-z]{2,3}(?:-[A-Z][a-z]{3})?(?:-(?:[A-Z]{2}|\d{3}))?$/;
const ASSET_PATH_PATTERN = /^assets\/[a-zA-Z0-9][a-zA-Z0-9._/-]*$/;

export interface LocalizedGameText {
  readonly description?: string;
  readonly title: string;
}

export interface GameArtworkReference {
  readonly kind: 'cover' | 'icon' | 'screenshot';
  readonly locale?: string;
  readonly path: string;
}

export interface GameMetadataProvenance {
  readonly attribution?: string;
  readonly license: string;
  readonly source: string;
}

export interface GameIdentifier {
  readonly namespace: string;
  readonly value: string;
}

export interface GamePlayerCount {
  readonly maximum: number;
  readonly minimum: number;
}

export interface GameMetadataRecord {
  readonly artwork?: readonly GameArtworkReference[];
  readonly consoleId: string;
  readonly developers?: readonly string[];
  readonly genres?: readonly string[];
  readonly id: string;
  readonly identifiers?: readonly GameIdentifier[];
  readonly playerCount?: GamePlayerCount;
  readonly provenance: GameMetadataProvenance;
  readonly publishers?: readonly string[];
  readonly releaseDate?: string;
  readonly text: Readonly<Record<string, LocalizedGameText>>;
}

export interface ResolvedGameMetadata {
  readonly artwork?: GameArtworkReference;
  readonly developers?: readonly string[];
  readonly description?: string;
  readonly genres?: readonly string[];
  readonly playerCount?: GamePlayerCount;
  readonly pluginId: string;
  readonly provenance: GameMetadataProvenance;
  readonly publishers?: readonly string[];
  readonly releaseDate?: string;
  readonly title: string;
}

export interface GameMetadataDefinition {
  readonly defaultLocale: string;
  readonly id: string;
  readonly records: readonly GameMetadataRecord[];
}

export interface GameMetadataPluginDefinition {
  readonly manifest: PluginManifest;
  readonly metadata: GameMetadataDefinition;
}

export interface GameMetadataPluginDiagnostic {
  readonly code:
    | 'game-metadata-definition-invalid'
    | 'game-metadata-manifest-invalid'
    | 'game-metadata-manifest-type-invalid';
  readonly message: string;
  readonly path: readonly (number | string)[];
}

export interface ValidGameMetadataPluginDefinition {
  readonly definition: GameMetadataPluginDefinition;
  readonly status: 'valid';
}

export interface InvalidGameMetadataPluginDefinition {
  readonly diagnostics: readonly GameMetadataPluginDiagnostic[];
  readonly status: 'invalid';
}

export type GameMetadataPluginValidationResult =
  InvalidGameMetadataPluginDefinition | ValidGameMetadataPluginDefinition;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const hasOnlyKeys = (value: Record<string, unknown>, keys: readonly string[]): boolean => {
  const allowed = new Set(keys);
  return Object.keys(value).every((key) => allowed.has(key));
};

const isNonEmptyString = (value: unknown, maxLength = 240): value is string =>
  typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength;

const isLocale = (value: unknown): value is string =>
  typeof value === 'string' && value.length <= 35 && LOCALE_PATTERN.test(value);

const diagnostic = (
  path: readonly (number | string)[],
  message: string,
  code: GameMetadataPluginDiagnostic['code'] = 'game-metadata-definition-invalid',
): GameMetadataPluginDiagnostic => ({ code, message, path });

const isLocalizedText = (value: unknown): value is LocalizedGameText =>
  isRecord(value) &&
  hasOnlyKeys(value, ['description', 'title']) &&
  isNonEmptyString(value['title'], 160) &&
  (value['description'] === undefined || isNonEmptyString(value['description'], 2_000));

const isArtworkReference = (value: unknown): value is GameArtworkReference => {
  if (!isRecord(value) || !hasOnlyKeys(value, ['kind', 'locale', 'path'])) return false;
  const path = value['path'];
  return (
    (value['kind'] === 'cover' || value['kind'] === 'icon' || value['kind'] === 'screenshot') &&
    (value['locale'] === undefined || isLocale(value['locale'])) &&
    typeof path === 'string' &&
    path.length <= 240 &&
    ASSET_PATH_PATTERN.test(path) &&
    !path.split('/').includes('..')
  );
};

const isProvenance = (value: unknown): value is GameMetadataProvenance =>
  isRecord(value) &&
  hasOnlyKeys(value, ['attribution', 'license', 'source']) &&
  isNonEmptyString(value['license'], 120) &&
  isNonEmptyString(value['source'], 240) &&
  (value['attribution'] === undefined || isNonEmptyString(value['attribution'], 500));

const isIdentifier = (value: unknown): value is GameIdentifier =>
  isRecord(value) &&
  hasOnlyKeys(value, ['namespace', 'value']) &&
  typeof value['namespace'] === 'string' &&
  IDENTIFIER_PATTERN.test(value['namespace']) &&
  typeof value['value'] === 'string' &&
  /^[\x20-\x7e]{1,64}$/.test(value['value']);

const isStringList = (value: unknown): value is readonly string[] =>
  Array.isArray(value) &&
  value.length > 0 &&
  value.length <= 32 &&
  value.every((entry) => isNonEmptyString(entry, 120)) &&
  new Set(value).size === value.length;

const isPlayerCount = (value: unknown): value is GamePlayerCount =>
  isRecord(value) &&
  hasOnlyKeys(value, ['maximum', 'minimum']) &&
  Number.isInteger(value['minimum']) &&
  Number.isInteger(value['maximum']) &&
  (value['minimum'] as number) > 0 &&
  (value['maximum'] as number) >= (value['minimum'] as number) &&
  (value['maximum'] as number) <= 64;

const validateRecord = (
  value: unknown,
  index: number,
  defaultLocale: unknown,
): readonly GameMetadataPluginDiagnostic[] => {
  const path = ['metadata', 'records', index] as const;
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, [
      'artwork',
      'consoleId',
      'developers',
      'genres',
      'id',
      'identifiers',
      'playerCount',
      'provenance',
      'publishers',
      'releaseDate',
      'text',
    ])
  )
    return [diagnostic(path, 'A metadata record must contain only supported declarative fields.')];

  const diagnostics: GameMetadataPluginDiagnostic[] = [];
  if (typeof value['id'] !== 'string' || !IDENTIFIER_PATTERN.test(value['id']))
    diagnostics.push(
      diagnostic([...path, 'id'], 'A game metadata ID must be lowercase kebab-case.'),
    );
  if (typeof value['consoleId'] !== 'string' || !PLUGIN_ID_PATTERN.test(value['consoleId']))
    diagnostics.push(
      diagnostic(
        [...path, 'consoleId'],
        'A metadata record must reference a reverse-DNS console ID.',
      ),
    );
  if (!isProvenance(value['provenance']))
    diagnostics.push(
      diagnostic([...path, 'provenance'], 'Metadata provenance requires a source and license.'),
    );
  if (
    value['identifiers'] !== undefined &&
    (!Array.isArray(value['identifiers']) ||
      value['identifiers'].length === 0 ||
      !value['identifiers'].every(isIdentifier))
  )
    diagnostics.push(
      diagnostic([...path, 'identifiers'], 'Game identifiers must be safe declarative pairs.'),
    );
  for (const field of ['developers', 'publishers', 'genres'] as const)
    if (value[field] !== undefined && !isStringList(value[field]))
      diagnostics.push(diagnostic([...path, field], `${field} must be a unique string list.`));
  if (
    value['releaseDate'] !== undefined &&
    (typeof value['releaseDate'] !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value['releaseDate']))
  )
    diagnostics.push(diagnostic([...path, 'releaseDate'], 'Release date must use YYYY-MM-DD.'));
  if (value['playerCount'] !== undefined && !isPlayerCount(value['playerCount']))
    diagnostics.push(diagnostic([...path, 'playerCount'], 'Player count is invalid.'));

  const text = value['text'];
  if (
    !isRecord(text) ||
    Object.keys(text).length === 0 ||
    Object.entries(text).some(([locale, entry]) => !isLocale(locale) || !isLocalizedText(entry))
  )
    diagnostics.push(
      diagnostic([...path, 'text'], 'Localized text must contain valid locale entries and titles.'),
    );
  else if (typeof defaultLocale === 'string' && text[defaultLocale] === undefined)
    diagnostics.push(
      diagnostic([...path, 'text', defaultLocale], 'Each record must include the default locale.'),
    );

  const artwork = value['artwork'];
  if (artwork !== undefined) {
    if (!Array.isArray(artwork) || artwork.length === 0 || !artwork.every(isArtworkReference))
      diagnostics.push(
        diagnostic(
          [...path, 'artwork'],
          'Artwork must use safe package-relative asset references.',
        ),
      );
    else {
      const keys = artwork.map(({ kind, locale = '' }) => `${kind}:${locale}`);
      if (new Set(keys).size !== keys.length)
        diagnostics.push(
          diagnostic([...path, 'artwork'], 'Artwork kind and locale combinations must be unique.'),
        );
    }
  }

  return diagnostics;
};

export const defineGameMetadata = <TDefinition extends GameMetadataPluginDefinition>(
  definition: TDefinition,
): TDefinition => definition;

export const validateGameMetadataPlugin = (input: unknown): GameMetadataPluginValidationResult => {
  if (!isRecord(input))
    return {
      diagnostics: [diagnostic([], 'A game metadata plugin definition must be an object.')],
      status: 'invalid',
    };

  const manifestResult = PluginManifestSchema.safeParse(input['manifest']);
  if (!manifestResult.success)
    return {
      diagnostics: manifestResult.error.issues.map((issue) =>
        diagnostic(
          [
            'manifest',
            ...issue.path.filter(
              (part): part is number | string =>
                typeof part === 'number' || typeof part === 'string',
            ),
          ],
          issue.message,
          'game-metadata-manifest-invalid',
        ),
      ),
      status: 'invalid',
    };

  if (manifestResult.data.type !== 'game-metadata')
    return {
      diagnostics: [
        diagnostic(
          ['manifest', 'type'],
          'A game metadata definition must use a game-metadata manifest.',
          'game-metadata-manifest-type-invalid',
        ),
      ],
      status: 'invalid',
    };

  const metadata = input['metadata'];
  if (!isRecord(metadata) || !hasOnlyKeys(metadata, ['defaultLocale', 'id', 'records']))
    return {
      diagnostics: [diagnostic(['metadata'], 'A game metadata definition must be declarative.')],
      status: 'invalid',
    };

  const diagnostics: GameMetadataPluginDiagnostic[] = [];
  const defaultLocale = metadata['defaultLocale'];
  const id = metadata['id'];
  const records = metadata['records'];

  if (!isLocale(defaultLocale))
    diagnostics.push(
      diagnostic(['metadata', 'defaultLocale'], 'A valid default locale is required.'),
    );
  if (typeof id !== 'string' || id !== manifestResult.data.id)
    diagnostics.push(
      diagnostic(
        ['metadata', 'id'],
        'The metadata identifier must match the plugin manifest identifier.',
      ),
    );

  if (!Array.isArray(records) || records.length === 0) {
    diagnostics.push(
      diagnostic(['metadata', 'records'], 'A metadata plugin must declare at least one record.'),
    );
  } else {
    records.forEach((record, index) =>
      diagnostics.push(...validateRecord(record, index, defaultLocale)),
    );
    const recordIds = records.flatMap((record) =>
      isRecord(record) && typeof record['id'] === 'string' ? [record['id']] : [],
    );
    if (new Set(recordIds).size !== recordIds.length)
      diagnostics.push(
        diagnostic(['metadata', 'records'], 'Game metadata record IDs must be unique.'),
      );
  }

  if (diagnostics.length > 0) return { diagnostics, status: 'invalid' };
  return { definition: input as unknown as GameMetadataPluginDefinition, status: 'valid' };
};

export const resolveGameMetadata = (
  plugins: readonly unknown[],
  identifiers: readonly GameIdentifier[],
  locale: string,
): ResolvedGameMetadata | undefined => {
  for (const plugin of plugins) {
    const validated = validateGameMetadataPlugin(plugin);
    if (validated.status !== 'valid') continue;
    const { metadata } = validated.definition;
    for (const record of metadata.records) {
      if (
        record.identifiers?.some((candidate) =>
          identifiers.some(
            (identifier) =>
              identifier.namespace === candidate.namespace && identifier.value === candidate.value,
          ),
        ) !== true
      )
        continue;
      const text = record.text[locale] ?? record.text[metadata.defaultLocale];
      if (text === undefined) continue;
      const artwork =
        record.artwork?.find((candidate) => candidate.locale === locale) ??
        record.artwork?.find((candidate) => candidate.locale === undefined) ??
        record.artwork?.find((candidate) => candidate.locale === metadata.defaultLocale);
      return {
        ...(artwork === undefined ? {} : { artwork }),
        ...(record.developers === undefined ? {} : { developers: record.developers }),
        ...(text.description === undefined ? {} : { description: text.description }),
        ...(record.genres === undefined ? {} : { genres: record.genres }),
        ...(record.playerCount === undefined ? {} : { playerCount: record.playerCount }),
        pluginId: metadata.id,
        provenance: record.provenance,
        ...(record.publishers === undefined ? {} : { publishers: record.publishers }),
        ...(record.releaseDate === undefined ? {} : { releaseDate: record.releaseDate }),
        title: text.title,
      };
    }
  }
  return undefined;
};

export const isResolvedGameMetadata = (value: unknown): value is ResolvedGameMetadata =>
  isRecord(value) &&
  hasOnlyKeys(value, [
    'artwork',
    'developers',
    'description',
    'genres',
    'playerCount',
    'pluginId',
    'provenance',
    'publishers',
    'releaseDate',
    'title',
  ]) &&
  PLUGIN_ID_PATTERN.test(typeof value['pluginId'] === 'string' ? value['pluginId'] : '') &&
  isNonEmptyString(value['title'], 160) &&
  isProvenance(value['provenance']) &&
  (value['artwork'] === undefined || isArtworkReference(value['artwork'])) &&
  (value['description'] === undefined || isNonEmptyString(value['description'], 2_000)) &&
  (value['developers'] === undefined || isStringList(value['developers'])) &&
  (value['genres'] === undefined || isStringList(value['genres'])) &&
  (value['playerCount'] === undefined || isPlayerCount(value['playerCount'])) &&
  (value['publishers'] === undefined || isStringList(value['publishers'])) &&
  (value['releaseDate'] === undefined ||
    (typeof value['releaseDate'] === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value['releaseDate'])));
