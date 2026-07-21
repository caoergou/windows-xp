import { describe, it, expect } from 'vitest';
import {
  type Card,
  type GameState,
  applyMove,
  applyScore,
  canPlaceOnFoundation,
  canPlaceOnTableau,
  checkWin,
  createDeck,
  dealFromStock,
  dealGame,
  getMovableCards,
  getTopCard,
  isRed,
  redealPenalty,
  scoreForMove,
  takeSnapshot,
  SCORING,
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
      tableaus: [[card('spades', 6, false), card('hearts', 5, true)], [card('clubs', 4, false)]],
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

  it('recycled stock preserves the original waste order on redeal', () => {
    const state: GameState = {
      stock: [],
      waste: [card('spades', 1, true), card('hearts', 2, true), card('clubs', 3, true)],
      foundations: [[], [], [], []],
      tableaus: [[], []],
    };

    // Waste top is the last card; after recycling it must come out first again.
    const recycled = dealFromStock(state);
    const redealt = dealFromStock(dealFromStock(dealFromStock(recycled)));
    expect(redealt.waste.map(c => c.id)).toEqual(['spades-1', 'hearts-2', 'clubs-3']);
  });
});

describe('draw three', () => {
  it('deals three cards per stock click, waste top is the last one', () => {
    const state: GameState = {
      stock: [
        card('spades', 1, false),
        card('hearts', 2, false),
        card('clubs', 3, false),
        card('diamonds', 4, false),
      ],
      waste: [],
      foundations: [[], [], [], []],
      tableaus: [[], []],
    };

    const next = dealFromStock(state, 3);
    expect(next.stock).toHaveLength(1);
    expect(next.waste.map(c => c.id)).toEqual(['diamonds-4', 'clubs-3', 'hearts-2']);
    expect(next.waste.every(c => c.faceUp)).toBe(true);
    expect(getTopCard(next.waste)?.id).toBe('hearts-2');
  });

  it('deals fewer than three when the stock runs short', () => {
    const state: GameState = {
      stock: [card('spades', 1, false), card('hearts', 2, false)],
      waste: [card('clubs', 5, true)],
      foundations: [[], [], [], []],
      tableaus: [[], []],
    };

    const next = dealFromStock(state, 3);
    expect(next.stock).toHaveLength(0);
    expect(next.waste.map(c => c.id)).toEqual(['clubs-5', 'hearts-2', 'spades-1']);
  });

  it('draw mode does not affect waste recycling', () => {
    const state: GameState = {
      stock: [],
      waste: [card('spades', 1, true), card('hearts', 2, true)],
      foundations: [[], [], [], []],
      tableaus: [[], []],
    };

    const next = dealFromStock(state, 3);
    expect(next.stock).toHaveLength(2);
    expect(next.waste).toHaveLength(0);
    expect(next.stock.every(c => !c.faceUp)).toBe(true);
  });
});

describe('standard scoring', () => {
  const base: GameState = {
    stock: [],
    waste: [card('hearts', 5, true)],
    foundations: [[card('hearts', 1, true)], [], [], []],
    tableaus: [[card('spades', 6, false), card('clubs', 5, true)], [card('diamonds', 9, true)]],
  };

  it('waste to tableau scores 5', () => {
    expect(
      scoreForMove(
        base,
        [card('hearts', 5, true)],
        { type: 'waste' },
        { type: 'tableau', index: 1 }
      )
    ).toBe(SCORING.wasteToTableau);
  });

  it('waste to foundation scores 10', () => {
    expect(
      scoreForMove(
        base,
        [card('hearts', 5, true)],
        { type: 'waste' },
        { type: 'foundation', index: 0 }
      )
    ).toBe(SCORING.wasteToFoundation);
  });

  it('tableau to foundation scores 10 plus 5 when a face-down card flips', () => {
    const moving = [card('clubs', 5, true)];
    const delta = scoreForMove(
      base,
      moving,
      { type: 'tableau', index: 0 },
      { type: 'foundation', index: 0 }
    );
    expect(delta).toBe(SCORING.tableauToFoundation + SCORING.flipTableau);
  });

  it('tableau to tableau scores only the flip bonus', () => {
    const delta = scoreForMove(
      base,
      [card('clubs', 5, true)],
      { type: 'tableau', index: 0 },
      { type: 'tableau', index: 1 }
    );
    expect(delta).toBe(SCORING.flipTableau);
  });

  it('tableau moves without a hidden card below score nothing', () => {
    const state: GameState = {
      ...base,
      tableaus: [[card('clubs', 5, true)], [card('diamonds', 6, true)]],
    };
    expect(
      scoreForMove(
        state,
        [card('clubs', 5, true)],
        { type: 'tableau', index: 0 },
        { type: 'tableau', index: 1 }
      )
    ).toBe(0);
  });

  it('foundation to tableau costs 15', () => {
    expect(
      scoreForMove(
        base,
        [card('hearts', 1, true)],
        { type: 'foundation', index: 0 },
        { type: 'tableau', index: 1 }
      )
    ).toBe(SCORING.foundationToTableau);
  });

  it('score never drops below zero', () => {
    expect(applyScore(10, -15)).toBe(0);
    expect(applyScore(20, -15)).toBe(5);
    expect(applyScore(0, 10)).toBe(10);
  });
});

describe('stock redeal penalty', () => {
  it('draw one penalizes every redeal after the first pass', () => {
    expect(redealPenalty(1, 1)).toBe(SCORING.draw1Redeal);
    expect(redealPenalty(1, 2)).toBe(SCORING.draw1Redeal);
  });

  it('draw three allows two free redeals, then costs 20', () => {
    expect(redealPenalty(3, 1)).toBe(0);
    expect(redealPenalty(3, 2)).toBe(0);
    expect(redealPenalty(3, 3)).toBe(SCORING.draw3Redeal);
    expect(redealPenalty(3, 4)).toBe(SCORING.draw3Redeal);
  });
});

describe('undo snapshot', () => {
  it('captures state, score and redeals', () => {
    const state: GameState = {
      stock: [card('spades', 1, false)],
      waste: [card('hearts', 2, true)],
      foundations: [[], [], [], []],
      tableaus: [[card('clubs', 3, true)]],
    };

    const snapshot = takeSnapshot(state, 45, 2);
    expect(snapshot.score).toBe(45);
    expect(snapshot.redeals).toBe(2);
    expect(snapshot.state).toEqual(state);
  });

  it('is unaffected by later moves applied to the live state', () => {
    const state: GameState = {
      stock: [],
      waste: [card('hearts', 1, true)],
      foundations: [[], [], [], []],
      tableaus: [[card('spades', 6, false), card('hearts', 5, true)], [card('clubs', 6, true)]],
    };

    const snapshot = takeSnapshot(state, 10, 0);
    const moved = applyMove(
      state,
      [card('hearts', 5, true)],
      { type: 'tableau', index: 0 },
      { type: 'tableau', index: 1 }
    );
    const redealt = dealFromStock(moved);

    // Snapshot still holds the pre-move board.
    expect(snapshot.state.tableaus[0]).toEqual([card('spades', 6, false), card('hearts', 5, true)]);
    expect(snapshot.state.waste).toEqual([card('hearts', 1, true)]);
    expect(redealt).not.toEqual(snapshot.state);
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
