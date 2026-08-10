import { err, ok } from '@platform/core';
import type { CoreError, JsonStoragePort, Result } from '@platform/core';
import type { JsonValue } from '@platform/shared';

const libraryKey = 'local-games';

export interface LocalGame {
  readonly addedAt: string;
  readonly artworkKey?: string;
  readonly extension: '.gb' | '.gbc';
  readonly favorite: boolean;
  readonly id: string;
  readonly lastPlayedAt?: string;
  readonly name: string;
  /** Opaque host-only reference; never expose a filesystem path to the renderer. */
  readonly sourceKey: string;
}

export interface RegisterLocalGame {
  readonly extension: LocalGame['extension'];
  readonly name: string;
  readonly sourceKey: string;
}

export type LibraryCollection = 'all' | 'favorites' | 'recent';

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

    const game: LocalGame = {
      ...input,
      addedAt: this.now(),
      favorite: false,
      id: this.createId(),
    };
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

  public async find(id: string): Promise<Result<LocalGame>> {
    const games = await this.list();
    if (!games.ok) return games;
    const game = games.value.find((candidate) => candidate.id === id);
    return game === undefined ? err(notFound('The game is not in the local library.')) : ok(game);
  }

  public async setFavorite(id: string, favorite: boolean): Promise<Result<LocalGame>> {
    return this.update(id, (game) => ({ ...game, favorite }));
  }

  public async markPlayed(id: string): Promise<Result<LocalGame>> {
    return this.update(id, (game) => ({ ...game, lastPlayedAt: this.now() }));
  }

  public async setArtwork(id: string, artworkKey: string): Promise<Result<LocalGame>> {
    if (artworkKey.trim().length === 0) return err(invalid('Artwork requires an opaque key.'));
    return this.update(id, (game) => ({ ...game, artworkKey }));
  }

  private async update(
    id: string,
    transform: (game: LocalGame) => LocalGame,
  ): Promise<Result<LocalGame>> {
    const games = await this.list();
    if (!games.ok) return games;
    const index = games.value.findIndex((game) => game.id === id);
    if (index < 0) return err(notFound('The game is not in the local library.'));
    const current = games.value[index];
    if (current === undefined) return err(notFound('The game is not in the local library.'));
    const updated = transform(current);
    const next = games.value.map((game) => (game.id === id ? updated : game));
    const stored = await this.storage.write('game-library', libraryKey, gamesToJson(next));
    return stored.ok ? ok(updated) : stored;
  }
}

export const queryLocalGames = (
  games: readonly LocalGame[],
  query: string,
  collection: LibraryCollection = 'all',
): readonly LocalGame[] => {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filtered = games.filter((game) => {
    if (collection === 'favorites' && !game.favorite) return false;
    if (collection === 'recent' && game.lastPlayedAt === undefined) return false;
    return normalizedQuery.length === 0 || game.name.toLocaleLowerCase().includes(normalizedQuery);
  });
  return [...filtered].sort((left, right) => {
    if (collection === 'recent')
      return (right.lastPlayedAt ?? '').localeCompare(left.lastPlayedAt ?? '');
    return left.name.localeCompare(right.name);
  });
};

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
    if (game['artworkKey'] !== undefined && typeof game['artworkKey'] !== 'string')
      return undefined;
    if (game['lastPlayedAt'] !== undefined && typeof game['lastPlayedAt'] !== 'string')
      return undefined;
    return {
      addedAt: game['addedAt'],
      ...(typeof game['artworkKey'] === 'string' ? { artworkKey: game['artworkKey'] } : {}),
      extension: game['extension'],
      favorite: typeof game['favorite'] === 'boolean' ? game['favorite'] : false,
      id: game['id'],
      ...(typeof game['lastPlayedAt'] === 'string' ? { lastPlayedAt: game['lastPlayedAt'] } : {}),
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
const notFound = (message: string): CoreError => ({ code: 'not-found', message });
