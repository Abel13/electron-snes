import { err, ok } from '@platform/core';
import type { CoreError, JsonStoragePort, Result } from '@platform/core';
import type { JsonValue } from '@platform/shared';

const libraryKey = 'local-games';

export interface LocalGame {
  readonly addedAt: string;
  readonly extension: '.gb' | '.gbc';
  readonly id: string;
  readonly name: string;
  /** Opaque host-only reference; never expose a filesystem path to the renderer. */
  readonly sourceKey: string;
}

export interface RegisterLocalGame {
  readonly extension: LocalGame['extension'];
  readonly name: string;
  readonly sourceKey: string;
}

export class LocalGameLibrary {
  public constructor(
    private readonly storage: JsonStoragePort,
    private readonly createId: () => string,
    private readonly now: () => string,
  ) {}

  public async add(input: RegisterLocalGame): Promise<Result<LocalGame>> {
    if (!isRegisterable(input))
      return err(invalid('A local game requires a name and opaque source key.'));
    const games = await this.list();
    if (!games.ok) return games;
    if (games.value.some((game) => game.sourceKey === input.sourceKey))
      return err(conflict('This local ROM is already in the library.'));

    const game: LocalGame = { ...input, addedAt: this.now(), id: this.createId() };
    const stored = await this.storage.write(
      'game-library',
      libraryKey,
      gamesToJson([...games.value, game]),
    );
    return stored.ok ? ok(game) : stored;
  }

  public async list(): Promise<Result<readonly LocalGame[]>> {
    const stored = await this.storage.read('game-library', libraryKey);
    if (!stored.ok) return stored;
    if (stored.value === undefined) return ok([]);
    const games = gamesFromJson(stored.value);
    return games === undefined
      ? err(invalid('The local game library contains an invalid record.'))
      : ok(games);
  }
}

const gamesToJson = (games: readonly LocalGame[]): JsonValue => games.map((game) => ({ ...game }));

const gamesFromJson = (value: JsonValue): readonly LocalGame[] | undefined => {
  if (!Array.isArray(value)) return undefined;
  const games = value.map((entry) => {
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) return undefined;
    const game = entry as Record<string, JsonValue>;
    if (
      typeof game['addedAt'] !== 'string' ||
      (game['extension'] !== '.gb' && game['extension'] !== '.gbc') ||
      typeof game['id'] !== 'string' ||
      typeof game['name'] !== 'string' ||
      typeof game['sourceKey'] !== 'string'
    )
      return undefined;
    return {
      addedAt: game['addedAt'],
      extension: game['extension'],
      id: game['id'],
      name: game['name'],
      sourceKey: game['sourceKey'],
    };
  });
  return games.every((game): game is LocalGame => game !== undefined) ? games : undefined;
};

const isRegisterable = (input: RegisterLocalGame): boolean =>
  input.name.trim().length > 0 && input.sourceKey.trim().length > 0;

const invalid = (message: string): CoreError => ({ code: 'invalid-input', message });
const conflict = (message: string): CoreError => ({ code: 'conflict', message });
