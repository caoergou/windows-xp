/**
 * Scenario sticky notes (#207) — renders the {@link NotesContext} store onto the
 * desktop. Each note is a little paper card a scenario pins via the `note`
 * action (`removeNote` to clear it); the player can also dismiss one with its ×.
 * A narration channel that lives on the desktop surface (below app windows).
 *
 * Colours are named CSS colours (off the #143 inline-hex ratchet); the visual
 * echoes the classic `components/StickyNote` without depending on culture data.
 */
import React from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useNotes } from '../context/NotesContext';
import type { NoteColor } from '../scenario/types';

const PAPER: Record<NoteColor, { bg: string; edge: string; ink: string }> = {
  yellow: { bg: 'lightyellow', edge: 'goldenrod', ink: 'saddlebrown' },
  blue: { bg: 'aliceblue', edge: 'steelblue', ink: 'midnightblue' },
  pink: { bg: 'mistyrose', edge: 'palevioletred', ink: 'mediumvioletred' },
  green: { bg: 'honeydew', edge: 'seagreen', ink: 'darkgreen' },
};

const Layer = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none; /* only the cards catch clicks, not the whole overlay */
  z-index: 50;
`;

const Card = styled.div<{ $c: NoteColor }>`
  position: absolute;
  pointer-events: auto;
  width: 200px;
  padding: 12px 12px 11px;
  background: ${p => PAPER[p.$c].bg};
  border: 1px solid ${p => PAPER[p.$c].edge};
  box-shadow: 2px 3px 9px rgba(0, 0, 0, 0.3);
  transform: rotate(-1.5deg);
  font-family: 'Comic Sans MS', 'SimSun', '微软雅黑', cursive, sans-serif;
  user-select: none;
`;

const Title = styled.div<{ $c: NoteColor }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  font-weight: bold;
  color: ${p => PAPER[p.$c].ink};
  border-bottom: 1px dashed ${p => PAPER[p.$c].edge};
  padding-bottom: 5px;
  margin-bottom: 7px;
`;

const Close = styled.span<{ $c: NoteColor }>`
  cursor: pointer;
  font-size: 12px;
  line-height: 1;
  padding: 0 2px;
  color: ${p => PAPER[p.$c].edge};
  &:hover {
    filter: brightness(0.7);
  }
`;

const Body = styled.div<{ $c: NoteColor }>`
  font-size: 12px;
  line-height: 1.7;
  white-space: pre-wrap;
  color: ${p => PAPER[p.$c].ink};
`;

const StickyNotesLayer: React.FC = () => {
  const { notes, removeNote } = useNotes();
  const { t } = useTranslation();
  if (notes.length === 0) return null;

  return (
    <Layer className="sticky-note" aria-hidden={false} data-testid="sticky-notes">
      {notes.map((note, i) => {
        const color = note.color ?? 'yellow';
        // Auto-stack from the top-right when the author gives no position.
        const style =
          note.x !== undefined || note.y !== undefined
            ? { left: note.x, top: note.y }
            : { right: 20, top: 80 + i * 132 };
        return (
          <Card key={note.id} $c={color} style={style} data-testid={`note-${note.id}`}>
            <Title $c={color}>
              <span>{note.title ?? t('stickyNote.defaultTitle')}</span>
              <Close
                $c={color}
                role="button"
                title={t('stickyNote.dismiss')}
                data-testid={`note-close-${note.id}`}
                onClick={() => removeNote(note.id)}
              >
                ×
              </Close>
            </Title>
            <Body $c={color}>{note.content}</Body>
          </Card>
        );
      })}
    </Layer>
  );
};

export default StickyNotesLayer;
