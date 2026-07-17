/**
 * Evidence Board (#219, mechanic M4) — the Roottrees / Shadows-of-Doubt corkboard
 * as a scenario-layer app. Pin evidence to the board, string two pinned items
 * together, or unpin. It emits `evidence:pin` / `evidence:link` / `evidence:unpin`;
 * scenarios gate on the derived predicates `pinned(id)` / `linked(a, b)` (both
 * read from the event journal, so the engine needs no live board state).
 *
 * Content (the evidence pool) is scenario-provided via props (axiom 2). Positions
 * are auto-assigned; links are drawn as red string between pinned cards.
 */
import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { resolveOSTheme } from '../../themes/useOSTheme';
import { useXPEventBus } from '../../context/EventBusContext';

export interface EvidenceItem {
  id: string;
  label: string;
  icon?: string;
}

export interface EvidenceBoardProps {
  boardId?: string;
  title?: string;
  /** The evidence pool shown in the tray. */
  items?: EvidenceItem[];
  windowId?: string;
}

interface Placed {
  id: string;
  x: number;
  y: number;
}

const CARD_W = 104;
const CARD_H = 40;

const Wrap = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  font-family: Tahoma, sans-serif;
  font-size: 12px;
  color: black;
  background: ${({ theme }) => resolveOSTheme(theme).tokens.SURFACE};
`;

const Tray = styled.div`
  width: 150px;
  flex-shrink: 0;
  border-right: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_SHADOW};
  padding: 8px;
  overflow-y: auto;
`;

const TrayHeading = styled.div`
  font-weight: bold;
  margin-bottom: 6px;
`;

const TrayItem = styled.button<{ $done?: boolean }>`
  display: block;
  width: 100%;
  text-align: left;
  margin: 3px 0;
  padding: 4px 6px;
  font-family: Tahoma, sans-serif;
  font-size: 12px;
  background: ${p => (p.$done ? resolveOSTheme(p.theme).tokens.SURFACE : 'white')};
  color: ${p => (p.$done ? resolveOSTheme(p.theme).tokens.BUTTON_SHADOW : 'black')};
  border: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_BORDER};
  border-radius: 3px;
  cursor: ${p => (p.$done ? 'default' : 'pointer')};
`;

const Board = styled.div`
  position: relative;
  flex: 1;
  overflow: hidden;
  background: burlywood;
  box-shadow: inset 0 0 30px rgba(0, 0, 0, 0.35);
`;

const Hint = styled.div`
  position: absolute;
  left: 8px;
  bottom: 6px;
  color: saddlebrown;
  opacity: 0.85;
`;

const Card = styled.div<{ $selected?: boolean }>`
  position: absolute;
  width: ${CARD_W}px;
  min-height: ${CARD_H}px;
  box-sizing: border-box;
  background: lightyellow;
  border: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_SHADOW};
  outline: ${p =>
    p.$selected ? `2px solid ${resolveOSTheme(p.theme).tokens.DIALOG_BLUE}` : 'none'};
  box-shadow: 1px 2px 3px rgba(0, 0, 0, 0.4);
  padding: 8px 6px 4px;
  cursor: pointer;
  user-select: none;
  z-index: 1;
`;

const Pin = styled.div`
  position: absolute;
  top: -5px;
  left: 50%;
  width: 9px;
  height: 9px;
  margin-left: -4px;
  border-radius: 50%;
  background: crimson;
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.5);
`;

// A <span>, not a <button>: xp.css's scoped `button` rules (min-width/padding)
// out-specify a styled class and would inflate a 14px close affordance into a
// card-covering hit target.
const Unpin = styled.span`
  position: absolute;
  top: 0;
  right: 2px;
  width: 14px;
  height: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  font-size: 11px;
  color: ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_SHADOW};
  cursor: pointer;
`;

const EvidenceBoard: React.FC<EvidenceBoardProps> = ({ boardId = 'board', title, items = [] }) => {
  const { t } = useTranslation();
  const bus = useXPEventBus();
  const [placed, setPlaced] = useState<Placed[]>([]);
  const [links, setLinks] = useState<{ a: string; b: string }[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  const byId = useMemo(() => new Map(items.map(i => [i.id, i])), [items]);
  const isPinned = (id: string) => placed.some(p => p.id === id);

  const pin = (id: string) => {
    if (isPinned(id)) return;
    const i = placed.length;
    const x = 18 + (i % 3) * (CARD_W + 26);
    const y = 20 + Math.floor(i / 3) * (CARD_H + 40);
    setPlaced(prev => [...prev, { id, x, y }]);
    bus.emit({ type: 'evidence:pin', itemId: id });
  };

  const unpin = (id: string) => {
    setPlaced(prev => prev.filter(p => p.id !== id));
    setLinks(prev => prev.filter(l => l.a !== id && l.b !== id));
    if (selected === id) setSelected(null);
    bus.emit({ type: 'evidence:unpin', itemId: id });
  };

  const clickCard = (id: string) => {
    if (selected === null) {
      setSelected(id);
      return;
    }
    if (selected === id) {
      setSelected(null);
      return;
    }
    const exists = links.some(
      l => (l.a === selected && l.b === id) || (l.a === id && l.b === selected)
    );
    if (!exists) {
      setLinks(prev => [...prev, { a: selected, b: id }]);
      bus.emit({ type: 'evidence:link', sourceId: selected, targetId: id });
    }
    setSelected(null);
  };

  const center = (id: string) => {
    const p = placed.find(q => q.id === id);
    return p ? { x: p.x + CARD_W / 2, y: p.y + CARD_H / 2 } : null;
  };

  return (
    <Wrap data-testid="evidence-board" data-board-id={boardId}>
      <Tray>
        <TrayHeading>{t('evidenceBoard.tray')}</TrayHeading>
        {items.map(i => (
          <TrayItem
            key={i.id}
            data-testid={`tray-${i.id}`}
            $done={isPinned(i.id)}
            disabled={isPinned(i.id)}
            onClick={() => pin(i.id)}
          >
            {i.label}
          </TrayItem>
        ))}
      </Tray>
      <Board>
        <svg
          width="100%"
          height="100%"
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
          aria-hidden
        >
          {links.map((l, idx) => {
            const a = center(l.a);
            const b = center(l.b);
            if (!a || !b) return null;
            return (
              <line
                key={idx}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="firebrick"
                strokeWidth={2}
              />
            );
          })}
        </svg>
        {placed.map(p => (
          <Card
            key={p.id}
            data-testid={`card-${p.id}`}
            $selected={selected === p.id}
            style={{ left: p.x, top: p.y }}
            onClick={() => clickCard(p.id)}
          >
            <Pin />
            <Unpin
              data-testid={`unpin-${p.id}`}
              role="button"
              title={t('evidenceBoard.unpin')}
              onClick={e => {
                e.stopPropagation();
                unpin(p.id);
              }}
            >
              ✕
            </Unpin>
            {byId.get(p.id)?.label ?? p.id}
          </Card>
        ))}
        <Hint>{t('evidenceBoard.linkHint')}</Hint>
      </Board>
    </Wrap>
  );
};

export default EvidenceBoard;
