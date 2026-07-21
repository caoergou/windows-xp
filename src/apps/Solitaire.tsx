import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import styled, { css } from 'styled-components';
import { useWindowManagerActions } from '../context/WindowManagerContext';
import { useXPEventBus } from '../context/EventBusContext';
import { useShortcut } from '../context/KeymapContext';
import {
  XPMenuBar,
  XPMenuBarItem,
  XPMenuSlot,
  XPMenuDropdown,
  XPMenuDropdownItem,
  XPMenuMark,
  XPMenuSeparator,
} from '../components/XPMenuBar';
import { XPStatusBar, XPStatusBarField } from '../components/XPStatusBar';
import {
  type Card,
  type DrawMode,
  type GameSnapshot,
  type GameState,
  type PileLocation,
  applyMove,
  applyScore,
  canPlaceOnFoundation,
  canPlaceOnTableau,
  checkWin,
  dealFromStock,
  dealGame,
  getCardAtPosition,
  getMovableCards,
  getTopCard,
  redealPenalty,
  scoreForMove,
  takeSnapshot,
  RANK_LABELS,
  SUIT_SYMBOLS,
} from './solitaireLogic';
import { resolveOSTheme } from '../themes/useOSTheme';

/* brand-palette:start — centrally declared app-identity colours (#213 batch 4).
   Exempt from the guard:purity hex ratchet; NOT COLORS tokens on purpose: this
   app keeps its own period look even if the OS theme is swapped (#143). */
const PALETTE = {
  blue800: '#003366',
  green700: '#008000',
  green600: '#00CC00',
  blue700: '#1A3C8A',
  red500: '#FF0000',
};
/* brand-palette:end */

const CARD_WIDTH = 71;
const CARD_HEIGHT = 96;
const TABLEAU_OFFSET = 18;

/* Victory animation physics (sol.exe: cards launch off the foundations with a
   random initial velocity, fall under gravity and bounce until they fly off). */
const GRAVITY = 0.5; // px per frame² at 60fps
const BOUNCE_DAMPING = 0.8;
const SPAWN_INTERVAL_MS = 110;
const MAX_BOUNCE_AGE_MS = 6000; // after this a card falls through the floor

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
};

/* Card index under the pointer inside a tableau pile, derived from clientY and
   the pile's own rect — e.nativeEvent.offsetY would be relative to the event
   target (the card or an element inside it), not the pile container. */
const cardIndexFromClientY = (pileEl: HTMLElement, clientY: number, pileLength: number): number => {
  if (pileLength === 0) return -1;
  const rect = pileEl.getBoundingClientRect();
  const raw = Math.floor((clientY - rect.top) / TABLEAU_OFFSET);
  return Math.min(Math.max(0, raw), pileLength - 1);
};

const Wrap = styled.div`
  width: 100%;
  height: 100%;
  background: ${PALETTE.green700};
  display: flex;
  flex-direction: column;
  padding: 0;
  box-sizing: border-box;
  font-family: ${({ theme }) => resolveOSTheme(theme).fonts.UI};
  font-size: 12px;
  user-select: none;
  color: ${({ theme }) => resolveOSTheme(theme).tokens.WHITE};
  overflow: auto;
  position: relative;
`;

const TopArea = styled.div`
  display: flex;
  gap: 16px;
  padding: 10px;
  align-items: flex-start;
`;

const StockArea = styled.div`
  display: flex;
  gap: 10px;
`;

const FoundationArea = styled.div`
  display: flex;
  gap: 10px;
  margin-left: auto;
`;

const GameArea = styled.div`
  flex: 1;
  padding: 10px;
`;

const TableauArea = styled.div`
  display: flex;
  gap: 10px;
  align-items: flex-start;
`;

const PileSlot = styled.div<{ $empty?: boolean }>`
  width: ${CARD_WIDTH}px;
  height: ${CARD_HEIGHT}px;
  background: ${p => (p.$empty ? 'rgba(0, 255, 0, 0.15)' : 'transparent')};
  border: ${p => (p.$empty ? `2px solid ${PALETTE.green600}` : 'none')};
  border-radius: 4px;
  position: relative;
  box-sizing: border-box;
`;

/* Cards are absolutely positioned so they do not stretch the pile; give the
   pile an explicit height so the whole fanned stack is a valid drop target. */
const TableauPile = styled.div<{ $height: number }>`
  display: flex;
  flex-direction: column;
  width: ${CARD_WIDTH}px;
  height: ${p => p.$height}px;
  min-height: ${CARD_HEIGHT}px;
  position: relative;
  cursor: pointer;
`;

const cardBase = css`
  width: ${CARD_WIDTH}px;
  height: ${CARD_HEIGHT}px;
  border: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_SHADOW};
  border-radius: 3px;
  display: flex;
  flex-direction: column;
  padding: 4px;
  box-sizing: border-box;
  cursor: pointer;
  position: absolute;
  top: 0;
  left: 0;
  font-family: ${({ theme }) => resolveOSTheme(theme).fonts.UI};
`;

const FaceUpCard = styled.div<{ $suit?: string }>`
  ${cardBase}
  background: ${({ theme }) => resolveOSTheme(theme).tokens.WHITE};
  color: ${p =>
    p.$suit === 'hearts' || p.$suit === 'diamonds'
      ? PALETTE.red500
      : resolveOSTheme(p.theme).tokens.BLACK};

  &:hover {
    filter: brightness(0.97);
  }
`;

const FaceDownCard = styled.div`
  ${cardBase}
  background: ${PALETTE.blue700};
  background-image:
    repeating-linear-gradient(
      45deg,
      transparent,
      transparent 6px,
      rgba(255, 255, 255, 0.08) 6px,
      rgba(255, 255, 255, 0.08) 12px
    ),
    repeating-linear-gradient(
      -45deg,
      transparent,
      transparent 6px,
      rgba(0, 0, 0, 0.08) 6px,
      rgba(0, 0, 0, 0.08) 12px
    );
  border: 1px solid ${PALETTE.blue800};
`;

const CardRank = styled.div`
  font-size: 13px;
  font-weight: bold;
  line-height: 1;
`;

const CardSuit = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
`;

const DragOverlay = styled.div<{ $x: number; $y: number; $bouncing: boolean }>`
  position: fixed;
  left: ${p => p.$x}px;
  top: ${p => p.$y}px;
  pointer-events: none;
  z-index: 10000;
  transition: ${p => (p.$bouncing ? 'left 200ms ease-out, top 200ms ease-out' : 'none')};
`;

const DragStackCard = styled.div<{ $offset: number; $suit?: string }>`
  ${cardBase}
  background: ${({ theme }) => resolveOSTheme(theme).tokens.WHITE};
  position: absolute;
  top: ${p => p.$offset}px;
  left: 0;
  color: ${p =>
    p.$suit === 'hearts' || p.$suit === 'diamonds'
      ? PALETTE.red500
      : resolveOSTheme(p.theme).tokens.BLACK};
  box-shadow: 2px 2px 6px rgba(0, 0, 0, 0.35);
`;

const WinMessage = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: ${({ theme }) => resolveOSTheme(theme).tokens.BORDER_GREY_HILIGHT};
  color: ${({ theme }) => resolveOSTheme(theme).tokens.BLACK};
  border: 2px solid;
  border-color: ${({ theme }) => resolveOSTheme(theme).tokens.WHITE}
    ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_SHADOW}
    ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_SHADOW}
    ${({ theme }) => resolveOSTheme(theme).tokens.WHITE};
  padding: 16px 24px;
  font-size: 16px;
  font-weight: bold;
  text-align: center;
  z-index: 100;
`;

const VictoryOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 10001;
`;

const AboutDialog = styled.div`
  position: absolute;
  z-index: 30;
  top: 28px;
  left: 50%;
  width: 220px;
  transform: translateX(-50%);
  border: 2px solid;
  border-color: ${({ theme }) => resolveOSTheme(theme).tokens.WHITE}
    ${({ theme }) => resolveOSTheme(theme).tokens.GREY_40}
    ${({ theme }) => resolveOSTheme(theme).tokens.GREY_40}
    ${({ theme }) => resolveOSTheme(theme).tokens.WHITE};
  background: ${({ theme }) => resolveOSTheme(theme).tokens.BORDER_GREY_HILIGHT};
  box-shadow: 2px 2px 1px ${({ theme }) => resolveOSTheme(theme).tokens.GREY_64};
  color: ${({ theme }) => resolveOSTheme(theme).tokens.BLACK};
`;

const AboutTitle = styled.div`
  padding: 4px 6px;
  color: ${({ theme }) => resolveOSTheme(theme).tokens.WHITE};
  background: ${({ theme }) => resolveOSTheme(theme).tokens.TITLE_BAR_GRADIENT_COMPACT};
  font-weight: bold;
`;

const AboutContent = styled.div`
  padding: 16px 14px 12px;
  white-space: pre-line;
  line-height: 1.45;
`;

const AboutActions = styled.div`
  display: flex;
  justify-content: center;
  padding: 0 0 12px;
`;

const DialogButton = styled.button`
  min-width: 72px;
  height: 23px;
  border: 2px solid;
  border-color: ${({ theme }) => resolveOSTheme(theme).tokens.WHITE}
    ${({ theme }) => resolveOSTheme(theme).tokens.GREY_40}
    ${({ theme }) => resolveOSTheme(theme).tokens.GREY_40}
    ${({ theme }) => resolveOSTheme(theme).tokens.WHITE};
  background: ${({ theme }) => resolveOSTheme(theme).tokens.BORDER_GREY_HILIGHT};
  font: inherit;

  &:active {
    border-color: ${({ theme }) => resolveOSTheme(theme).tokens.GREY_40}
      ${({ theme }) => resolveOSTheme(theme).tokens.WHITE}
      ${({ theme }) => resolveOSTheme(theme).tokens.WHITE}
      ${({ theme }) => resolveOSTheme(theme).tokens.GREY_40};
  }
`;

const SolitaireCard: React.FC<{
  card: Card;
  offset?: number;
  onMouseDown?: (e: React.MouseEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
}> = ({ card, offset = 0, onMouseDown, onDoubleClick }) => {
  if (!card.faceUp) {
    return <FaceDownCard style={{ top: offset }} />;
  }

  return (
    <FaceUpCard
      $suit={card.suit}
      style={{ top: offset }}
      onMouseDown={onMouseDown}
      onDoubleClick={onDoubleClick}
    >
      <CardRank>{RANK_LABELS[card.rank]}</CardRank>
      <CardSuit>{SUIT_SYMBOLS[card.suit]}</CardSuit>
    </FaceUpCard>
  );
};

interface DragState {
  cards: Card[];
  source: PileLocation;
  startX: number;
  startY: number;
  x: number;
  y: number;
  pointerOffsetX: number;
  pointerOffsetY: number;
  bouncing: boolean;
}

interface FlyingCard {
  card: Card;
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
}

interface QueuedCard {
  card: Card;
  x: number;
  y: number;
}

interface VictoryAnimation {
  raf: number;
  lastTime: number;
  lastSpawn: number;
  queue: QueuedCard[];
  particles: FlyingCard[];
  launched: Set<string>;
}

type WinPhase = 'idle' | 'animating' | 'done';

const Solitaire = ({ windowId }: { windowId?: string }) => {
  const { t, i18n } = useTranslation();
  const { setWindowTitle, closeWindow } = useWindowManagerActions();
  const bus = useXPEventBus();
  const [openMenu, setOpenMenu] = useState<'game' | 'help' | null>(null);
  const [gameState, setGameState] = useState<GameState>(() => dealGame());
  const [drag, setDrag] = useState<DragState | null>(null);
  const [won, setWon] = useState(false);
  const [winPhase, setWinPhase] = useState<WinPhase>('idle');
  const [drawMode, setDrawMode] = useState<DrawMode>(1);
  const [score, setScore] = useState(0);
  const [redeals, setRedeals] = useState(0);
  const [undo, setUndo] = useState<GameSnapshot | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [aboutOpen, setAboutOpen] = useState(false);
  // Track the win transition so game:win fires once, not on every re-render.
  const wonRef = useRef(false);
  const animRef = useRef<VictoryAnimation | null>(null);
  const [, setAnimTick] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const foundationRefs = useRef<(HTMLDivElement | null)[]>([]);
  const tableauRefs = useRef<(HTMLDivElement | null)[]>([]);
  const stockRef = useRef<HTMLDivElement>(null);
  const wasteRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDocMouseDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, []);

  useEffect(() => {
    const isWon = checkWin(gameState.foundations);
    setWon(isWon);
    if (isWon && !wonRef.current) bus.emit({ type: 'game:win', appId: 'Solitaire' });
    wonRef.current = isWon;
    if (!isWon) setWinPhase('idle');
  }, [gameState, bus]);

  // Announce the opening deal once; subsequent new games emit from resetGame.
  useEffect(() => {
    bus.emit({ type: 'game:start', appId: 'Solitaire' });
  }, [bus]);

  useEffect(() => {
    if (windowId) setWindowTitle(windowId, t('apps.solitaire'));
  }, [i18n.language, setWindowTitle, t, windowId]);

  const cancelVictoryAnimation = useCallback(() => {
    if (animRef.current) {
      cancelAnimationFrame(animRef.current.raf);
      animRef.current = null;
    }
  }, []);

  // Skip (click) or natural end of the victory animation: show the win note.
  const finishVictory = useCallback(() => {
    cancelVictoryAnimation();
    setWinPhase('done');
  }, [cancelVictoryAnimation]);

  const resetGame = useCallback(() => {
    cancelVictoryAnimation();
    setGameState(dealGame());
    setScore(0);
    setRedeals(0);
    setUndo(null);
    setElapsed(0);
    setWon(false);
    setWinPhase('idle');
    wonRef.current = false;
    bus.emit({ type: 'game:start', appId: 'Solitaire' });
  }, [bus, cancelVictoryAnimation]);

  // XP sol.exe deals a fresh game when the draw mode changes.
  const selectDrawMode = useCallback(
    (mode: DrawMode) => {
      setOpenMenu(null);
      if (mode === drawMode) return;
      setDrawMode(mode);
      resetGame();
    },
    [drawMode, resetGame]
  );

  // One scored move: snapshot for undo, apply the XP delta, move the cards.
  const commitMove = useCallback(
    (cards: Card[], source: PileLocation, target: PileLocation) => {
      setUndo(takeSnapshot(gameState, score, redeals));
      setScore(prev => applyScore(prev, scoreForMove(gameState, cards, source, target)));
      setGameState(prev => applyMove(prev, cards, source, target));
    },
    [gameState, score, redeals]
  );

  const handleUndo = useCallback(() => {
    if (!undo || drag) return;
    setGameState(undo.state);
    setScore(undo.score);
    setRedeals(undo.redeals);
    setUndo(null);
  }, [undo, drag]);

  const handleStockClick = useCallback(() => {
    if (gameState.stock.length === 0 && gameState.waste.length === 0) return;
    setUndo(takeSnapshot(gameState, score, redeals));
    if (gameState.stock.length === 0) {
      // Recycling the waste starts another pass through the stock.
      const nextRedeals = redeals + 1;
      setRedeals(nextRedeals);
      setScore(prev => applyScore(prev, redealPenalty(drawMode, nextRedeals)));
    }
    setGameState(prev => dealFromStock(prev, drawMode));
  }, [gameState, score, redeals, drawMode]);

  const findDropTarget = useCallback((clientX: number, clientY: number): PileLocation | null => {
    for (let i = 0; i < foundationRefs.current.length; i++) {
      const el = foundationRefs.current[i];
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom
      ) {
        return { type: 'foundation', index: i };
      }
    }

    for (let i = 0; i < tableauRefs.current.length; i++) {
      const el = tableauRefs.current[i];
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom
      ) {
        return { type: 'tableau', index: i };
      }
    }

    return null;
  }, []);

  const tryAutoMoveToFoundation = useCallback(
    (card: Card, source: PileLocation): boolean => {
      if (drag) return false;
      for (let i = 0; i < 4; i++) {
        if (canPlaceOnFoundation(card, gameState.foundations[i])) {
          commitMove([card], source, { type: 'foundation', index: i });
          return true;
        }
      }
      return false;
    },
    [drag, gameState.foundations, commitMove]
  );

  const startDrag = useCallback(
    (
      cards: Card[],
      source: PileLocation,
      cardEl: HTMLElement,
      clientX: number,
      clientY: number
    ) => {
      const rect = cardEl.getBoundingClientRect();
      setDrag({
        cards,
        source,
        startX: rect.left,
        startY: rect.top,
        x: rect.left,
        y: rect.top,
        pointerOffsetX: clientX - rect.left,
        pointerOffsetY: clientY - rect.top,
        bouncing: false,
      });
    },
    []
  );

  const handleTableauMouseDown = useCallback(
    (e: React.MouseEvent, pileIndex: number) => {
      e.preventDefault();
      if (e.button !== 0) return;

      const pile = gameState.tableaus[pileIndex];
      const pileEl = e.currentTarget as HTMLElement;
      const cardIndex = cardIndexFromClientY(pileEl, e.clientY, pile.length);
      if (cardIndex < 0) return;
      const location: PileLocation = { type: 'tableau', index: pileIndex };
      const movable = getCardAtPosition(gameState, location, cardIndex);
      if (!movable) return;

      const cardEl = pileEl.children[cardIndex] as HTMLElement | undefined;
      if (!cardEl) return;

      startDrag(movable.cards, movable.source, cardEl, e.clientX, e.clientY);
    },
    [gameState, startDrag]
  );

  const handleWasteMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (e.button !== 0) return;

      const movable = getMovableCards(gameState, { type: 'waste' });
      if (!movable) return;

      startDrag(
        movable.cards,
        movable.source,
        e.currentTarget as HTMLElement,
        e.clientX,
        e.clientY
      );
    },
    [gameState, startDrag]
  );

  const handleFoundationMouseDown = useCallback(
    (e: React.MouseEvent, index: number) => {
      e.preventDefault();
      if (e.button !== 0) return;

      const movable = getMovableCards(gameState, { type: 'foundation', index });
      if (!movable) return;

      startDrag(
        movable.cards,
        movable.source,
        e.currentTarget as HTMLElement,
        e.clientX,
        e.clientY
      );
    },
    [gameState, startDrag]
  );

  const handleTableauDoubleClick = useCallback(
    (e: React.MouseEvent, pileIndex: number) => {
      e.stopPropagation();
      const pile = gameState.tableaus[pileIndex];
      const faceUpStart = pile.findIndex(card => card.faceUp);
      if (faceUpStart === -1) return;

      const cardIndex = pile.length - 1;
      const location: PileLocation = { type: 'tableau', index: pileIndex };
      const movable = getCardAtPosition(gameState, location, cardIndex);
      if (!movable || movable.cards.length !== 1) return;

      tryAutoMoveToFoundation(movable.cards[0], movable.source);
    },
    [gameState, tryAutoMoveToFoundation]
  );

  const handleWasteDoubleClick = useCallback(
    (_e: React.MouseEvent) => {
      const movable = getMovableCards(gameState, { type: 'waste' });
      if (!movable || movable.cards.length !== 1) return;

      tryAutoMoveToFoundation(movable.cards[0], movable.source);
    },
    [gameState, tryAutoMoveToFoundation]
  );

  // XP sol.exe: right-clicking a card sends it to a foundation when it fits.
  const handleTableauContextMenu = useCallback(
    (e: React.MouseEvent, pileIndex: number) => {
      e.preventDefault();
      if (drag) return;

      const pile = gameState.tableaus[pileIndex];
      const pileEl = e.currentTarget as HTMLElement;
      const cardIndex = cardIndexFromClientY(pileEl, e.clientY, pile.length);
      // Only the exposed top card can ever go to a foundation.
      if (cardIndex !== pile.length - 1) return;
      const location: PileLocation = { type: 'tableau', index: pileIndex };
      const movable = getCardAtPosition(gameState, location, cardIndex);
      if (!movable || movable.cards.length !== 1) return;

      tryAutoMoveToFoundation(movable.cards[0], movable.source);
    },
    [drag, gameState, tryAutoMoveToFoundation]
  );

  const handleWasteContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (drag) return;

      const movable = getMovableCards(gameState, { type: 'waste' });
      if (!movable || movable.cards.length !== 1) return;

      tryAutoMoveToFoundation(movable.cards[0], movable.source);
    },
    [drag, gameState, tryAutoMoveToFoundation]
  );

  // App-scoped shortcuts (#132) — fire only when Solitaire is focused.
  const solApp = { scope: 'app' as const, appId: 'Solitaire' };
  useShortcut({ id: 'solitaire.newGame', combo: 'F2', ...solApp, label: 'New game' }, () => {
    if (winPhase !== 'animating') resetGame();
  });
  useShortcut({ id: 'solitaire.undo', combo: 'Mod+Z', ...solApp, label: 'Undo' }, () => {
    if (winPhase !== 'animating') handleUndo();
  });

  useEffect(() => {
    if (!drag) return;

    const bounceBack = () => {
      setDrag(prev => (prev ? { ...prev, x: prev.startX, y: prev.startY, bouncing: true } : prev));
    };

    const handleMouseMove = (e: MouseEvent) => {
      setDrag(prev =>
        prev && !prev.bouncing
          ? {
              ...prev,
              x: e.clientX - prev.pointerOffsetX,
              y: e.clientY - prev.pointerOffsetY,
            }
          : prev
      );
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button !== 0) return;
      setDrag(prev => {
        if (!prev) return null;
        // Cancelled by a right-button press mid-drag (XP sol.exe behavior).
        if (prev.bouncing) return prev;

        const target = findDropTarget(e.clientX, e.clientY);
        let valid = false;

        if (target && target.type !== 'stock' && target.type !== 'waste') {
          if (target.type === 'foundation' && prev.cards.length === 1) {
            valid = canPlaceOnFoundation(prev.cards[0], gameState.foundations[target.index]);
          } else if (target.type === 'tableau') {
            valid = canPlaceOnTableau(prev.cards, gameState.tableaus[target.index]);
          }
        }

        if (valid && target) {
          commitMove(prev.cards, prev.source, target);
          return null;
        }

        return { ...prev, x: prev.startX, y: prev.startY, bouncing: true };
      });
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 2) bounceBack();
    };

    const handleContextMenu = (e: MouseEvent) => e.preventDefault();

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('contextmenu', handleContextMenu);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [drag, findDropTarget, gameState, commitMove]);

  // Clear bounce-back drag state after animation
  useEffect(() => {
    if (drag?.bouncing) {
      const timer = setTimeout(() => setDrag(null), 220);
      return () => clearTimeout(timer);
    }
  }, [drag?.bouncing]);

  // Game timer — runs until the winning move, restarts on a new deal.
  useEffect(() => {
    if (won) return;
    const id = window.setInterval(() => setElapsed(prev => prev + 1), 1000);
    return () => window.clearInterval(id);
  }, [won]);

  const startVictoryAnimation = useCallback(() => {
    if (animRef.current) return;

    const piles = gameState.foundations.map((pile, index) => ({
      cards: [...pile],
      rect: foundationRefs.current[index]?.getBoundingClientRect() ?? null,
    }));
    // sol.exe launches cards one at a time, cycling the four foundations.
    const queue: QueuedCard[] = [];
    let remaining = piles.reduce((n, pile) => n + pile.cards.length, 0);
    for (let i = 0; remaining > 0; i = (i + 1) % piles.length) {
      const card = piles[i].cards.pop();
      if (!card) continue;
      queue.push({
        card,
        x: piles[i].rect?.left ?? 0,
        y: piles[i].rect?.top ?? 0,
      });
      remaining--;
    }

    const anim: VictoryAnimation = {
      raf: 0,
      lastTime: performance.now(),
      lastSpawn: 0,
      queue,
      particles: [],
      launched: new Set<string>(),
    };
    animRef.current = anim;
    setWinPhase('animating');

    const step = (now: number) => {
      const current = animRef.current;
      if (!current) return;

      const dtMs = Math.min(50, now - current.lastTime);
      const dt = dtMs / (1000 / 60);
      current.lastTime = now;

      if (current.queue.length > 0 && now - current.lastSpawn >= SPAWN_INTERVAL_MS) {
        current.lastSpawn = now;
        const next = current.queue.shift();
        if (next) {
          current.launched.add(next.card.id);
          current.particles.push({
            card: next.card,
            x: next.x,
            y: next.y,
            vx: Math.random() * 6 - 3,
            vy: -(9 + Math.random() * 4),
            age: 0,
          });
        }
      }

      const floor = window.innerHeight;
      current.particles = current.particles.filter(p => {
        p.age += dtMs;
        p.vy += GRAVITY * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.x < 0) {
          p.x = 0;
          p.vx = Math.abs(p.vx);
        } else if (p.x > window.innerWidth - CARD_WIDTH) {
          p.x = window.innerWidth - CARD_WIDTH;
          p.vx = -Math.abs(p.vx);
        }
        if (p.y < 0) {
          p.y = 0;
          p.vy = Math.abs(p.vy);
        }
        if (p.y > floor - CARD_HEIGHT && p.age < MAX_BOUNCE_AGE_MS) {
          p.y = floor - CARD_HEIGHT;
          p.vy = -Math.abs(p.vy) * BOUNCE_DAMPING;
          p.vx += Math.random() * 2 - 1;
        }
        return p.y < floor + CARD_HEIGHT;
      });

      if (current.queue.length === 0 && current.particles.length === 0) {
        finishVictory();
        return;
      }

      setAnimTick(tick => tick + 1);
      current.raf = requestAnimationFrame(step);
    };
    anim.raf = requestAnimationFrame(step);
  }, [gameState.foundations, finishVictory]);

  useEffect(() => {
    if (won && winPhase === 'idle') startVictoryAnimation();
  }, [won, winPhase, startVictoryAnimation]);

  useEffect(() => cancelVictoryAnimation, [cancelVictoryAnimation]);

  const topWaste = getTopCard(gameState.waste);

  // During the victory animation the launched cards leave their foundation.
  const getVisibleFoundationTop = (foundation: Card[]): Card | null => {
    const anim = animRef.current;
    if (winPhase !== 'animating' || !anim) return getTopCard(foundation);
    for (let i = foundation.length - 1; i >= 0; i--) {
      if (!anim.launched.has(foundation[i].id)) return foundation[i];
    }
    return null;
  };

  return (
    <Wrap ref={wrapRef} onContextMenu={e => e.preventDefault()}>
      <XPMenuBar ref={menuRef}>
        <XPMenuSlot>
          <XPMenuBarItem
            type="button"
            $active={openMenu === 'game'}
            onClick={() => setOpenMenu(cur => (cur === 'game' ? null : 'game'))}
          >
            {t('solitaire.menu.game')}
          </XPMenuBarItem>
          {openMenu === 'game' && (
            <XPMenuDropdown role="menu">
              <XPMenuDropdownItem
                type="button"
                role="menuitem"
                onClick={() => {
                  resetGame();
                  setOpenMenu(null);
                }}
              >
                <XPMenuMark />
                {t('solitaire.menuItems.new')}
              </XPMenuDropdownItem>
              <XPMenuDropdownItem
                type="button"
                role="menuitem"
                $disabled={!undo}
                onClick={() => {
                  handleUndo();
                  setOpenMenu(null);
                }}
              >
                <XPMenuMark />
                {t('solitaire.menuItems.undo')}
              </XPMenuDropdownItem>
              <XPMenuSeparator />
              <XPMenuDropdownItem type="button" role="menuitem" onClick={() => selectDrawMode(1)}>
                <XPMenuMark>{drawMode === 1 ? '✓' : ''}</XPMenuMark>
                {t('solitaire.menuItems.drawOne')}
              </XPMenuDropdownItem>
              <XPMenuDropdownItem type="button" role="menuitem" onClick={() => selectDrawMode(3)}>
                <XPMenuMark>{drawMode === 3 ? '✓' : ''}</XPMenuMark>
                {t('solitaire.menuItems.drawThree')}
              </XPMenuDropdownItem>
              <XPMenuSeparator />
              <XPMenuDropdownItem
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpenMenu(null);
                  if (windowId) closeWindow(windowId);
                }}
              >
                <XPMenuMark />
                {t('solitaire.menuItems.exit')}
              </XPMenuDropdownItem>
            </XPMenuDropdown>
          )}
        </XPMenuSlot>
        <XPMenuSlot>
          <XPMenuBarItem
            type="button"
            $active={openMenu === 'help'}
            onClick={() => setOpenMenu(cur => (cur === 'help' ? null : 'help'))}
          >
            {t('solitaire.menu.help')}
          </XPMenuBarItem>
          {openMenu === 'help' && (
            <XPMenuDropdown role="menu">
              <XPMenuDropdownItem
                type="button"
                role="menuitem"
                onClick={() => {
                  setAboutOpen(true);
                  setOpenMenu(null);
                }}
              >
                <XPMenuMark />
                {t('solitaire.menuItems.about')}
              </XPMenuDropdownItem>
            </XPMenuDropdown>
          )}
        </XPMenuSlot>
      </XPMenuBar>

      <TopArea>
        <StockArea>
          <PileSlot $empty={gameState.stock.length === 0} ref={stockRef} onClick={handleStockClick}>
            {gameState.stock.length > 0 && <FaceDownCard />}
          </PileSlot>
          <PileSlot $empty={!topWaste} ref={wasteRef} onContextMenu={handleWasteContextMenu}>
            {topWaste && (
              <SolitaireCard
                card={topWaste}
                onMouseDown={handleWasteMouseDown}
                onDoubleClick={handleWasteDoubleClick}
              />
            )}
          </PileSlot>
        </StockArea>

        <FoundationArea>
          {gameState.foundations.map((foundation, index) => {
            const top = getVisibleFoundationTop(foundation);
            return (
              <PileSlot
                $empty={!top}
                key={index}
                ref={el => {
                  foundationRefs.current[index] = el;
                }}
              >
                {top && (
                  <SolitaireCard
                    card={top}
                    onMouseDown={e => handleFoundationMouseDown(e, index)}
                  />
                )}
              </PileSlot>
            );
          })}
        </FoundationArea>
      </TopArea>

      <GameArea>
        <TableauArea>
          {gameState.tableaus.map((pile, pileIndex) => (
            <TableauPile
              key={pileIndex}
              $height={CARD_HEIGHT + Math.max(0, pile.length - 1) * TABLEAU_OFFSET}
              ref={el => {
                tableauRefs.current[pileIndex] = el;
              }}
              onMouseDown={e => handleTableauMouseDown(e, pileIndex)}
              onDoubleClick={e => handleTableauDoubleClick(e, pileIndex)}
              onContextMenu={e => handleTableauContextMenu(e, pileIndex)}
            >
              {pile.map((card, cardIndex) => (
                <SolitaireCard
                  key={`${pileIndex}-${card.id}`}
                  card={card}
                  offset={cardIndex * TABLEAU_OFFSET}
                />
              ))}
            </TableauPile>
          ))}
        </TableauArea>
      </GameArea>

      <XPStatusBar>
        <XPStatusBarField>{t('solitaire.status.score', { score })}</XPStatusBarField>
        <XPStatusBarField>
          {t('solitaire.status.time', { time: formatTime(elapsed) })}
        </XPStatusBarField>
      </XPStatusBar>

      {winPhase === 'done' && <WinMessage>{t('solitaire.won')}</WinMessage>}

      {aboutOpen && (
        <AboutDialog role="dialog" aria-modal="true" aria-label={t('solitaire.about.title')}>
          <AboutTitle>{t('solitaire.about.title')}</AboutTitle>
          <AboutContent>{t('solitaire.about.message')}</AboutContent>
          <AboutActions>
            <DialogButton type="button" autoFocus onClick={() => setAboutOpen(false)}>
              {t('solitaire.about.ok')}
            </DialogButton>
          </AboutActions>
        </AboutDialog>
      )}

      {drag &&
        createPortal(
          <DragOverlay
            $x={drag.x}
            $y={drag.y}
            $bouncing={drag.bouncing}
            className="windows-xp-portal"
          >
            {drag.cards.map((card, index) => (
              <DragStackCard key={card.id} $offset={index * TABLEAU_OFFSET} $suit={card.suit}>
                <CardRank>{RANK_LABELS[card.rank]}</CardRank>
                <CardSuit>{SUIT_SYMBOLS[card.suit]}</CardSuit>
              </DragStackCard>
            ))}
          </DragOverlay>,
          document.body
        )}

      {winPhase === 'animating' &&
        createPortal(
          <VictoryOverlay className="windows-xp-portal" onClick={finishVictory}>
            {(animRef.current?.particles ?? []).map(p => (
              <DragStackCard
                key={p.card.id}
                $offset={0}
                $suit={p.card.suit}
                style={{ left: p.x, top: p.y }}
              >
                <CardRank>{RANK_LABELS[p.card.rank]}</CardRank>
                <CardSuit>{SUIT_SYMBOLS[p.card.suit]}</CardSuit>
              </DragStackCard>
            ))}
          </VictoryOverlay>,
          document.body
        )}
    </Wrap>
  );
};

export default Solitaire;
