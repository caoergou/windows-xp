import { describe, it, expect } from 'vitest';
import {
  type Card,
  type GameState,
  applyMove,
  canPlaceOnFoundation,
  canPlaceOnTableau,
  checkWin,
  createDeck,
  dealFromStock,
  dealGame,
  getMovableCards,
  getTopCard,
  isRed,
} from '../src/apps/solitaireLogic';

const card = (suit: Card['suit'], rank: number, faceUp = true): Card => ({
  id: `${suit}-${rank}`,
  suit,
  rank,
  faceUp,
});

describe('solitaire helpers', () => {
  it('creates a full 52-card deck', () => {
    const deck = createDeck();
    expect(deck).toHaveLength(52);
    expect(deck.filter(c => c.suit === 'hearts')).toHaveLength(13);
    expect(deck.some(c => c.rank === 1 && c.suit === 'spades')).toBe(true);
  });

  it('identifies red suits', () => {
    expect(isRed('hearts')).toBe(true);
    expect(isRed('diamonds')).toBe(true);
    expect(isRed('spades')).toBe(false);
    expect(isRed('clubs')).toBe(false);
  });

  it('returns the top card of a pile', () => {
    expect(getTopCard([])).toBeNull();
    expect(getTopCard([card('hearts', 1), card('spades', 5)])).toEqual(card('spades', 5));
  });

  it('deals a standard Klondike layout', () => {
    const state = dealGame();
    expect(state.tableaus).toHaveLength(7);
    expect(state.tableaus.map(t => t.length)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(state.stock).toHaveLength(24);
    expect(state.foundations).toEqual([[], [], [], []]);

    state.tableaus.forEach(pile => {
      expect(pile[pile.length - 1].faceUp).toBe(true);
      expect(pile.slice(0, -1).every(c => !c.faceUp)).toBe(true);
    });
  });
});

describe('tableau rules', () => {
  it('allows King onto empty tableau', () => {
    expect(canPlaceOnTableau([card('spades', 13)], [])).toBe(true);
    expect(canPlaceOnTableau([card('hearts', 12)], [])).toBe(false);
  });

  it('requires alternating colors and descending rank', () => {
    expect(canPlaceOnTableau([card('hearts', 5)], [card('spades', 6)])).toBe(true);
    expect(canPlaceOnTableau([card('diamonds', 5)], [card('hearts', 6)])).toBe(false);
    expect(canPlaceOnTableau([card('hearts', 4)], [card('spades', 6)])).toBe(false);
    expect(canPlaceOnTableau([card('clubs', 5)], [card('spades', 6)])).toBe(false);
  });

  it('allows moving a valid stack onto tableau', () => {
    const stack = [card('hearts', 5), card('clubs', 4)];
    expect(canPlaceOnTableau(stack, [card('spades', 6)])).toBe(true);
  });
});

describe('foundation rules', () => {
  it('allows Ace onto empty foundation', () => {
    expect(canPlaceOnFoundation(card('hearts', 1), [])).toBe(true);
    expect(canPlaceOnFoundation(card('hearts', 2), [])).toBe(false);
  });

  it('requires same suit and ascending rank', () => {
    expect(canPlaceOnFoundation(card('hearts', 2), [card('hearts', 1)])).toBe(true);
    expect(canPlaceOnFoundation(card('diamonds', 2), [card('hearts', 1)])).toBe(false);
    expect(canPlaceOnFoundation(card('hearts', 3), [card('hearts', 1)])).toBe(false);
  });
});

describe('move application', () => {
  it('moves cards between piles and flips the revealed card', () => {
    const state: GameState = {
      stock: [],
      waste: [],
      foundations: [[], [], [], []],
      tableaus: [
        [card('spades', 6, false), card('hearts', 5, true)],
        [card('clubs', 4, false)],
      ],
    };

    const next = applyMove(
      state,
      [card('hearts', 5, true)],
      { type: 'tableau', index: 0 },
      { type: 'tableau', index: 1 }
    );

    expect(next.tableaus[0]).toEqual([card('spades', 6, true)]);
    expect(next.tableaus[1]).toEqual([card('clubs', 4, false), card('hearts', 5, true)]);
  });

  it('moves waste top card to foundation', () => {
    const state: GameState = {
      stock: [],
      waste: [card('hearts', 1, true)],
      foundations: [[], [], [], []],
      tableaus: [[], []],
    };

    const next = applyMove(
      state,
      [card('hearts', 1, true)],
      { type: 'waste' },
      { type: 'foundation', index: 0 }
    );

    expect(next.waste).toEqual([]);
    expect(next.foundations[0]).toEqual([card('hearts', 1, true)]);
  });
});

describe('win detection', () => {
  it('detects win when all foundations are full', () => {
    const fullFoundation = Array.from({ length: 13 }, (_, i) => card('hearts', i + 1));
    const foundations = [fullFoundation, fullFoundation, fullFoundation, fullFoundation];
    expect(checkWin(foundations)).toBe(true);
  });

  it('does not detect win with incomplete foundations', () => {
    const foundations = [
      Array.from({ length: 13 }, (_, i) => card('hearts', i + 1)),
      Array.from({ length: 12 }, (_, i) => card('spades', i + 1)),
      [],
      [],
    ];
    expect(checkWin(foundations)).toBe(false);
  });
});

describe('stock dealing', () => {
  it('moves top stock card to waste face up', () => {
    const state: GameState = {
      stock: [card('spades', 1, false), card('hearts', 2, false)],
      waste: [],
      foundations: [[], [], [], []],
      tableaus: [[], []],
    };

    const next = dealFromStock(state);
    expect(next.stock).toHaveLength(1);
    expect(next.waste).toHaveLength(1);
    expect(next.waste[0]).toEqual({ ...card('hearts', 2, false), faceUp: true });
  });

  it('recycles waste back to stock when stock is empty', () => {
    const state: GameState = {
      stock: [],
      waste: [card('spades', 1, true), card('hearts', 2, true)],
      foundations: [[], [], [], []],
      tableaus: [[], []],
    };

    const next = dealFromStock(state);
    expect(next.stock).toHaveLength(2);
    expect(next.waste).toHaveLength(0);
    expect(next.stock.every(c => !c.faceUp)).toBe(true);
  });
});

describe('movable cards', () => {
  it('returns only top waste card', () => {
    const state: GameState = {
      stock: [],
      waste: [card('spades', 1, true), card('hearts', 2, true)],
      foundations: [[], [], [], []],
      tableaus: [[], []],
    };

    const movable = getMovableCards(state, { type: 'waste' });
    expect(movable?.cards).toEqual([card('hearts', 2, true)]);
  });

  it('returns face-up tableau stack from clicked index', () => {
    const state: GameState = {
      stock: [],
      waste: [],
      foundations: [[], [], [], []],
      tableaus: [[card('spades', 7, false), card('hearts', 6, true), card('clubs', 5, true)]],
    };

    const movable = getMovableCards(state, { type: 'tableau', index: 0 });
    expect(movable?.cards).toEqual([card('hearts', 6, true), card('clubs', 5, true)]);
  });
});
