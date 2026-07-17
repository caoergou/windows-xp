/**
 * Deduction Sheet (#219, mechanic M3) — a scenario-layer app that activates the
 * `deduction:*` vocabulary. The player fills word-bank slots and submits; the
 * sheet judges in batches (Obra-Dinn "three at a time") and emits
 * `deduction:submit` / `deduction:verified` / `deduction:failed`. Correct groups
 * lock in. Content (prompt, word bank, slots, groups, solution) is scenario-
 * provided via props — the engine stays ignorant of the fiction (axiom 2).
 */
import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { resolveOSTheme } from '../../themes/useOSTheme';
import { useXPEventBus } from '../../context/EventBusContext';
import {
  judgeGroups,
  allGroupsVerified,
  type Assignment,
  type DeductionGroup,
  type DeductionSlot,
} from './logic';

export interface DeductionSheetProps {
  /** Stable form id carried on the emitted events. */
  formId?: string;
  /** Optional heading (i18n key or literal). */
  title?: string;
  /** Sentence with `[slotId]` placeholders rendered as inline selects. */
  prompt?: string;
  /** Words the player can choose from. */
  wordBank?: string[];
  /** Slots to fill. */
  slots?: DeductionSlot[];
  /** Slot groups judged together (each a batch). */
  groups?: DeductionGroup[];
  /** slot id → the correct word. */
  solution?: Record<string, string>;
  windowId?: string;
}

const Wrap = styled.div`
  width: 100%;
  height: 100%;
  overflow: auto;
  background: ${({ theme }) => resolveOSTheme(theme).tokens.SURFACE};
  font-family: Tahoma, sans-serif;
  font-size: 12px;
  color: black;
  padding: 14px 16px;
  box-sizing: border-box;
`;

const Title = styled.h2`
  margin: 0 0 10px;
  font-size: 14px;
`;

const Prompt = styled.div`
  line-height: 2;
  margin-bottom: 14px;
`;

const SlotSelect = styled.select<{ $verified?: boolean }>`
  font-family: Tahoma, sans-serif;
  font-size: 12px;
  margin: 0 2px;
  padding: 1px 2px;
  border: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.INPUT_BORDER};
  background: ${p => (p.$verified ? 'honeydew' : 'white')};
  color: black;
`;

const SlotRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 4px 0;
`;

const Label = styled.span`
  min-width: 88px;
  color: ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_SHADOW};
`;

const Bank = styled.div`
  margin: 10px 0 14px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const Chip = styled.span`
  padding: 2px 8px;
  border: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_BORDER};
  border-radius: 10px;
  background: white;
`;

const VerifyButton = styled.button`
  padding: 4px 16px;
  font-family: Tahoma, sans-serif;
  font-size: 12px;
  background: ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_GRADIENT};
  border: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_BORDER};
  border-radius: 3px;
  cursor: pointer;
  &:hover {
    box-shadow: ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_HOVER_SHADOW};
  }
`;

const Status = styled.div<{ $state: 'verified' | 'failed' | 'pending' }>`
  margin: 4px 0;
  color: ${p =>
    p.$state === 'verified'
      ? 'green'
      : p.$state === 'failed'
        ? 'firebrick'
        : resolveOSTheme(p.theme).tokens.BUTTON_SHADOW};
`;

const Solved = styled.div`
  margin-top: 12px;
  padding: 8px 10px;
  background: ${({ theme }) => resolveOSTheme(theme).tokens.TITLE_BAR_GRADIENT};
  color: white;
  font-weight: bold;
  border-radius: 3px;
`;

const DeductionSheet: React.FC<DeductionSheetProps> = ({
  formId = 'deduction',
  title,
  prompt,
  wordBank = [],
  slots = [],
  groups = [],
  solution = {},
}) => {
  const { t } = useTranslation();
  const bus = useXPEventBus();
  const [assignment, setAssignment] = useState<Assignment>({});
  const [verified, setVerified] = useState<Set<string>>(new Set());
  const [failed, setFailed] = useState<Set<string>>(new Set());

  // slot id → its group id, for locking a slot once its group verifies.
  const groupOf = useMemo(() => {
    const m: Record<string, string> = {};
    groups.forEach(g => g.slots.forEach(s => (m[s] = g.id)));
    return m;
  }, [groups]);

  const isLocked = (slotId: string) => verified.has(groupOf[slotId] ?? '');

  const choose = (slotId: string, word: string) => {
    if (isLocked(slotId)) return;
    setAssignment(prev => ({ ...prev, [slotId]: word }));
  };

  const renderSelect = (slotId: string) => {
    const v = verified.has(groupOf[slotId] ?? '');
    return (
      <SlotSelect
        key={slotId}
        data-testid={`slot-${slotId}`}
        $verified={v}
        disabled={v}
        value={assignment[slotId] ?? ''}
        onChange={e => choose(slotId, e.target.value)}
      >
        <option value="">{t('deductionSheet.choose')}</option>
        {wordBank.map(w => (
          <option key={w} value={w}>
            {w}
          </option>
        ))}
      </SlotSelect>
    );
  };

  const handleVerify = () => {
    bus.emit({ type: 'deduction:submit', formId, slots: { ...assignment } });
    const result = judgeGroups(assignment, groups, solution);
    if (result.verified.length) {
      setVerified(prev => new Set([...prev, ...result.verified]));
      setFailed(prev => new Set([...prev].filter(id => !result.verified.includes(id))));
      bus.emit({ type: 'deduction:verified', formId, groups: result.verified });
    }
    if (result.failed.length) {
      setFailed(prev => new Set([...prev, ...result.failed]));
      bus.emit({ type: 'deduction:failed', formId, groups: result.failed });
    }
  };

  const solved = allGroupsVerified(groups, verified);

  return (
    <Wrap data-testid="deduction-sheet">
      <Title>{t(title ?? 'deductionSheet.title')}</Title>

      {prompt ? (
        <Prompt>
          {prompt
            .split(/\[([^\]]+)\]/)
            .map((part, i) => (i % 2 === 1 ? renderSelect(part) : <span key={i}>{part}</span>))}
        </Prompt>
      ) : (
        <div>
          {slots.map(s => (
            <SlotRow key={s.id}>
              <Label>{s.label ?? s.id}</Label>
              {renderSelect(s.id)}
            </SlotRow>
          ))}
        </div>
      )}

      <Label as="div">{t('deductionSheet.wordBank')}</Label>
      <Bank>
        {wordBank.map(w => (
          <Chip key={w}>{w}</Chip>
        ))}
      </Bank>

      <VerifyButton data-testid="deduction-verify" onClick={handleVerify}>
        {t('deductionSheet.verify')}
      </VerifyButton>

      <div style={{ marginTop: 12 }}>
        {groups.map(g => {
          const state = verified.has(g.id) ? 'verified' : failed.has(g.id) ? 'failed' : 'pending';
          return (
            <Status key={g.id} $state={state} data-testid={`group-${g.id}`}>
              {state === 'verified' ? '✓ ' : state === 'failed' ? '✗ ' : '• '}
              {g.id}
            </Status>
          );
        })}
      </div>

      {solved && <Solved data-testid="deduction-solved">{t('deductionSheet.solved')}</Solved>}
    </Wrap>
  );
};

export default DeductionSheet;
