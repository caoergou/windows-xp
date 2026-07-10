import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import styled, { css } from 'styled-components';
import { useWindowManager } from '../context/WindowManagerContext';
import {
  type Card,
  type GameState,
  type PileLocation,
  applyMove,
  canPlaceOnFoundation,
  canPlaceOnTableau,
  checkWin,
  dealFromStock,
  dealGame,
  getCardAtPosition,
  getMovableCards,
  getTopCard,
  RANK_LABELS,
  SUIT_SYMBOLS,
} from '../lib/solitaire';

const CARD_WIDTH = 71;
const CARD_HEIGHT = 96;
const TABLEAU_OFFSET = 18;

const Wrap = styled.div`
  width: 100%;
  height: 100%;
  background: #008000;
  display: flex;
  flex-direction: column;
  padding: 0;
  box-sizing: border-box;
  font-family: "Tahoma", "SimSun", "Microsoft YaHei", sans-serif;
  font-size: 12px;
  user-select: none;
  color: #ffffff;
  overflow: auto;
  position: relative;
`;

const MenuBar = styled.div`
  background: #d4d0c8;
  padding: 2px 8px;
  margin-bottom: 0;
  color: #000000;
  display: flex;
  gap: 12px;
  border: 0;
  border-bottom: 1px solid #808080;
  flex-shrink: 0;
`;

const MenuItem = styled.button`
  background: transparent;
  border: none;
  color: #000000;
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  padding: 2px 6px;

  &:hover {
    background: #0a2463;
    color: #ffffff;
  }
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
`;

const PileSlot = styled.div<{ $empty?: boolean }>`
  width: ${CARD_WIDTH}px;
  height: ${CARD_HEIGHT}px;
  background: ${p => (p.$empty ? 'rgba(0, 255, 0, 0.15)' : 'transparent')};
  border: ${p => (p.$empty ? '2px solid #00cc00' : 'none')};
  border-radius: 4px;
  position: relative;
  box-sizing: border-box;
`;

const TableauPile = styled.div`
  display: flex;
  flex-direction: column;
  width: ${CARD_WIDTH}px;
  min-height: ${CARD_HEIGHT}px;
  position: relative;
  cursor: pointer;
`;

const cardBase = css`
  width: ${CARD_WIDTH}px;
  height: ${CARD_HEIGHT}px;
  border: 1px solid #808080;
  border-radius: 3px;
  display: flex;
  flex-direction: column;
  padding: 4px;
  box-sizing: border-box;
  cursor: pointer;
  position: absolute;
  top: 0;
  left: 0;
  font-family: "Tahoma", "SimSun", "Microsoft YaHei", sans-serif;
`;

const FaceUpCard = styled.div<{ $suit?: string }>`
  ${cardBase}
  background: #ffffff;
  color: ${p => (p.$suit === 'hearts' || p.$suit === 'diamonds' ? '#ff0000' : '#000000')};

  &:hover {
    filter: brightness(0.97);
  }
`;

const FaceDownCard = styled.div`
  ${cardBase}
  background: #1a3c8a;
  background-image:
    repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(255, 255, 255, 0.08) 6px, rgba(255, 255, 255, 0.08) 12px),
    repeating-linear-gradient(-45deg, transparent, transparent 6px, rgba(0, 0, 0, 0.08) 6px, rgba(0, 0, 0, 0.08) 12px);
  border: 1px solid #003366;
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
  background: #ffffff;
  position: absolute;
  top: ${p => p.$offset}px;
  left: 0;
  color: ${p => (p.$suit === 'hearts' || p.$suit === 'diamonds' ? '#ff0000' : '#000000')};
  box-shadow: 2px 2px 6px rgba(0, 0, 0, 0.35);
`;

const WinMessage = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #d4d0c8;
  color: #000000;
  border: 2px solid;
  border-color: #ffffff #808080 #808080 #ffffff;
  padding: 16px 24px;
  font-size: 16px;
  font-weight: bold;
  text-align: center;
  z-index: 100;
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

const Solitaire = ({ windowId }: { windowId?: string }) => {
  const { t, i18n } = useTranslation();
  const { setWindowTitle } = useWindowManager();
  const [gameState, setGameState] = useState<GameState>(() => dealGame());
  const [drag, setDrag] = useState<DragState | null>(null);
  const [won, setWon] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const foundationRefs = useRef<(HTMLDivElement | null)[]>([]);
  const tableauRefs = useRef<(HTMLDivElement | null)[]>([]);
  const stockRef = useRef<HTMLDivElement>(null);
  const wasteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setWon(checkWin(gameState.foundations));
  }, [gameState]);

  useEffect(() => {
    if (windowId) setWindowTitle(windowId, t('apps.solitaire'));
  }, [i18n.language, setWindowTitle, t, windowId]);

  const resetGame = useCallback(() => {
    setGameState(dealGame());
    setWon(false);
  }, []);

  const handleStockClick = useCallback(() => {
    setGameState(prev => dealFromStock(prev));
  }, []);

  const findDropTarget = useCallback(
    (clientX: number, clientY: number): PileLocation | null => {
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
    },
    []
  );

  const tryAutoMoveToFoundation = useCallback(
    (card: Card, source: PileLocation): boolean => {
      for (let i = 0; i < 4; i++) {
        if (canPlaceOnFoundation(card, gameState.foundations[i])) {
          setGameState(prev => applyMove(prev, [card], source, { type: 'foundation', index: i }));
          return true;
        }
      }
      return false;
    },
    [gameState.foundations]
  );

  const startDrag = useCallback(
    (cards: Card[], source: PileLocation, cardEl: HTMLElement, clientX: number, clientY: number) => {
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
      const rawIndex = Math.floor(e.nativeEvent.offsetY / TABLEAU_OFFSET);
      const cardIndex = Math.min(Math.max(0, rawIndex), pile.length - 1);
      const location: PileLocation = { type: 'tableau', index: pileIndex };
      const movable = getCardAtPosition(gameState, location, cardIndex);
      if (!movable) return;

      const pileEl = e.currentTarget as HTMLElement;
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

      startDrag(movable.cards, movable.source, e.currentTarget as HTMLElement, e.clientX, e.clientY);
    },
    [gameState, startDrag]
  );

  const handleFoundationMouseDown = useCallback(
    (e: React.MouseEvent, index: number) => {
      e.preventDefault();
      if (e.button !== 0) return;

      const movable = getMovableCards(gameState, { type: 'foundation', index });
      if (!movable) return;

      startDrag(movable.cards, movable.source, e.currentTarget as HTMLElement, e.clientX, e.clientY);
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

  useEffect(() => {
    if (!drag) return;

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
      setDrag(prev => {
        if (!prev) return null;

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
          setGameState(current => applyMove(current, prev.cards, prev.source, target));
          return null;
        }

        return { ...prev, x: prev.startX, y: prev.startY, bouncing: true };
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [drag, findDropTarget, gameState]);

  // Clear bounce-back drag state after animation
  useEffect(() => {
    if (drag?.bouncing) {
      const timer = setTimeout(() => setDrag(null), 220);
      return () => clearTimeout(timer);
    }
  }, [drag?.bouncing]);

  const topWaste = getTopCard(gameState.waste);

  return (
    <Wrap ref={wrapRef}>
      <MenuBar>
        <MenuItem onClick={resetGame}>{t('solitaire.menu.game')}</MenuItem>
        <MenuItem>{t('solitaire.menu.help')}</MenuItem>
      </MenuBar>

      <TopArea>
        <StockArea>
          <PileSlot $empty={gameState.stock.length === 0} ref={stockRef} onClick={handleStockClick}>
            {gameState.stock.length > 0 && <FaceDownCard />}
          </PileSlot>
          <PileSlot $empty={!topWaste} ref={wasteRef}>
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
            const top = getTopCard(foundation);
            return (
              <PileSlot $empty={!top} key={index} ref={el => { foundationRefs.current[index] = el; }}>
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
              ref={el => { tableauRefs.current[pileIndex] = el; }}
              onMouseDown={e => handleTableauMouseDown(e, pileIndex)}
              onDoubleClick={e => handleTableauDoubleClick(e, pileIndex)}
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

      {won && <WinMessage>{t('solitaire.won')}</WinMessage>}

      {drag &&
        createPortal(
          <DragOverlay $x={drag.x} $y={drag.y} $bouncing={drag.bouncing} className="windows-xp-portal">
            {drag.cards.map((card, index) => (
              <DragStackCard key={card.id} $offset={index * TABLEAU_OFFSET} $suit={card.suit}>
                <CardRank>{RANK_LABELS[card.rank]}</CardRank>
                <CardSuit>{SUIT_SYMBOLS[card.suit]}</CardSuit>
              </DragStackCard>
            ))}
          </DragOverlay>,
          document.body
        )}
    </Wrap>
  );
};

export default Solitaire;
