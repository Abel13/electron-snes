import { describe, expect, it } from 'vitest';
import {
  getCarouselSlots,
  moveCategoryIndex,
  moveGameIndex,
  moveGameOffset,
} from './console-library.js';

const games = Array.from({ length: 4 }, (_, index) => ({
  extension: '.gb' as const,
  favorite: index === 0,
  id: `game-${index}`,
  name: `Game ${index}`,
}));

describe('console library navigation', () => {
  it('keeps vertical categories within their limits', () => {
    expect(moveCategoryIndex(0, 'up')).toBe(0);
    expect(moveCategoryIndex(0, 'down')).toBe(1);
    expect(moveCategoryIndex(3, 'down')).toBe(3);
  });
  it('moves selection conventionally without wrapping', () => {
    expect(moveGameIndex(0, 'right', 4)).toBe(1);
    expect(moveGameIndex(1, 'left', 4)).toBe(0);
    expect(moveGameIndex(3, 'right', 4)).toBe(3);
    expect(moveGameIndex(0, 'left', 4)).toBe(0);
  });
  it('does not duplicate small libraries', () => {
    const slots = getCarouselSlots(games.slice(0, 2), 0);
    expect(slots).toHaveLength(2);
    expect(new Set(slots.map(({ game }) => game.id)).size).toBe(2);
    expect(slots.find(({ offset }) => offset === 0)?.game.id).toBe('game-0');
    expect(getCarouselSlots(games.slice(0, 1), 0)).toEqual([{ game: games[0], offset: 0 }]);
  });
  it('selects a clicked second neighbor directly', () => {
    expect(moveGameOffset(0, 2, 4)).toBe(2);
    expect(moveGameOffset(3, 2, 4)).toBe(3);
  });
});
