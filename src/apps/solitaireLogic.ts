export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';

export interface Card {
  id: string;
  suit: Suit;
  rank: number; // 1 = A, 11 = J, 12 = Q, 13 = K
  faceUp: boolean;
}

export type PileLocation =
  | { type: 'tableau'; index: number }
  | { type: 'foundation'; index: number }
  | { type: 'waste' }
  | { type: 'stock' };

export interface GameState {
  stock: Card[];
  waste: Card[];
  foundations: Card[][];
  tableaus: Card[][];
}

export const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];

export const RANK_LABELS: Record<number, string> = {
  1: 'A',
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  8: '8',
  9: '9',
  10: '10',
  11: 'J',
  12: 'Q',
  13: 'K',
};

export const SUIT_SYMBOLS: Record<Suit, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

export const isRed = (suit: Suit): boolean => suit === 'hearts' || suit === 'diamonds';

export const getTopCard = (pile: Card[]): Card | null => {
  return pile.length > 0 ? pile[pile.length - 1] : null;
};

export const createDeck = (): Card[] => {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (let rank = 1; rank <= 13; rank++) {
      deck.push({
        id: `${suit}-${rank}`,
        suit,
        rank,
        faceUp: false,
      });
    }
  }
  return deck;
};

export const shuffleDeck = (deck: Card[]): Card[] => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const dealGame = (): GameState => {
  const deck = shuffleDeck(createDeck());
  const tableaus: Card[][] = [];
  let deckIndex = 0;

  for (let i = 0; i < 7; i++) {
    const pile: Card[] = [];
    for (let j = 0; j <= i; j++) {
      const card = { ...deck[deckIndex] };
      card.faceUp = j === i;
      pile.push(card);
      deckIndex++;
    }
    tableaus.push(pile);
  }

  return {
    stock: deck.slice(deckIndex).map(card => ({ ...card, faceUp: false })),
    waste: [],
    foundations: [[], [], [], []],
    tableaus,
  };
};

export const canPlaceOnTableau = (cards: Card[], targetPile: Card[]): boolean => {
  if (cards.length === 0) return false;
  const topCard = cards[0];
  const targetTop = getTopCard(targetPile);

  if (!targetTop) {
    return topCard.rank === 13;
  }

  return isRed(topCard.suit) !== isRed(targetTop.suit) && topCard.rank === targetTop.rank - 1;
};

export const canPlaceOnFoundation = (card: Card, foundation: Card[]): boolean => {
  const topCard = getTopCard(foundation);
  if (!topCard) {
    return card.rank === 1;
  }
  return card.suit === topCard.suit && card.rank === topCard.rank + 1;
};

export const checkWin = (foundations: Card[][]): boolean => {
  return foundations.every(foundation => foundation.length === 13);
};

export const getMovableCards = (
  state: GameState,
  location: PileLocation
): { cards: Card[]; source: PileLocation } | null => {
  if (location.type === 'waste') {
    const card = getTopCard(state.waste);
    if (!card) return null;
    return { cards: [card], source: location };
  }

  if (location.type === 'foundation') {
    const card = getTopCard(state.foundations[location.index]);
    if (!card) return null;
    return { cards: [card], source: location };
  }

  if (location.type === 'tableau') {
    const pile = state.tableaus[location.index];
    const faceUpStart = pile.findIndex(card => card.faceUp);
    if (faceUpStart === -1) return null;
    return {
      cards: pile.slice(faceUpStart),
      source: location,
    };
  }

  return null;
};

export const getCardAtPosition = (
  state: GameState,
  location: PileLocation,
  cardIndex?: number
): { cards: Card[]; source: PileLocation } | null => {
  if (location.type === 'waste' || location.type === 'foundation') {
    return getMovableCards(state, location);
  }

  if (location.type === 'tableau') {
    const pile = state.tableaus[location.index];
    const startIndex = cardIndex ?? pile.findIndex(card => card.faceUp);
    if (startIndex === -1 || !pile[startIndex].faceUp) return null;
    return {
      cards: pile.slice(startIndex),
      source: { type: 'tableau', index: location.index },
    };
  }

  return null;
};

export const applyMove = (
  state: GameState,
  cards: Card[],
  source: PileLocation,
  target: PileLocation
): GameState => {
  const next: GameState = {
    stock: [...state.stock],
    waste: [...state.waste],
    foundations: state.foundations.map(f => [...f]),
    tableaus: state.tableaus.map(t => [...t]),
  };

  // Remove cards from source
  if (source.type === 'tableau') {
    next.tableaus[source.index] = next.tableaus[source.index].slice(0, -cards.length);
    const pile = next.tableaus[source.index];
    if (pile.length > 0 && !pile[pile.length - 1].faceUp) {
      pile[pile.length - 1] = { ...pile[pile.length - 1], faceUp: true };
    }
  } else if (source.type === 'waste') {
    next.waste = next.waste.slice(0, -cards.length);
  } else if (source.type === 'foundation') {
    next.foundations[source.index] = next.foundations[source.index].slice(0, -cards.length);
  }

  // Add cards to target
  const moved = cards.map(card => ({ ...card, faceUp: true }));
  if (target.type === 'tableau') {
    next.tableaus[target.index] = [...next.tableaus[target.index], ...moved];
  } else if (target.type === 'foundation') {
    next.foundations[target.index] = [...next.foundations[target.index], ...moved];
  } else if (target.type === 'waste') {
    next.waste = [...next.waste, ...moved];
  }

  return next;
};

export const dealFromStock = (state: GameState): GameState => {
  const next = {
    stock: [...state.stock],
    waste: [...state.waste],
    foundations: state.foundations.map(f => [...f]),
    tableaus: state.tableaus.map(t => [...t]),
  };

  if (next.stock.length === 0) {
    next.stock = next.waste.reverse().map(card => ({ ...card, faceUp: false }));
    next.waste = [];
  } else {
    const card = next.stock.pop();
    if (card) {
      next.waste.push({ ...card, faceUp: true });
    }
  }

  return next;
};
