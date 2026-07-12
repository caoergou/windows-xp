/**
 * Deduction Sheet (#219): the batched-verification judge (pure) + the app
 * emitting the `deduction:*` vocabulary that #189 added but nothing yet drove.
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { describe, it, expect, beforeEach } from 'vitest';
import { judgeGroups, allGroupsVerified } from '../src/apps/DeductionSheet/logic';
import DeductionSheet from '../src/apps/DeductionSheet';
import { demoDeduction } from '../src/data/scenarios/deductionDemo';
import xpI18n from '../src/i18n';
import { XPEventBus, type XPEvent } from '../src/events';
import { EventBusProvider } from '../src/context/EventBusContext';

describe('deduction judge (M3 batched verification)', () => {
  const groups = [
    { id: 'crime', slots: ['who', 'weapon'] },
    { id: 'lookout', slots: ['x'] },
  ];
  const solution = { who: 'A', weapon: 'bat', x: 'B' };

  it('gives no verdict on an incomplete group', () => {
    expect(judgeGroups({ who: 'A' }, groups, solution)).toEqual({ verified: [], failed: [] });
  });

  it('verifies a complete, correct group and fails a complete, wrong one', () => {
    const r = judgeGroups({ who: 'A', weapon: 'bat', x: 'wrong' }, groups, solution);
    expect(r.verified).toEqual(['crime']);
    expect(r.failed).toEqual(['lookout']);
  });

  it('allGroupsVerified only when every group is in', () => {
    expect(allGroupsVerified(groups, new Set(['crime']))).toBe(false);
    expect(allGroupsVerified(groups, new Set(['crime', 'lookout']))).toBe(true);
  });
});

describe('DeductionSheet app emits deduction:*', () => {
  let bus: XPEventBus;
  let events: XPEvent[];

  beforeEach(() => {
    bus = new XPEventBus();
    events = [];
    bus.subscribe(e => events.push(e));
  });

  const mount = () =>
    render(
      <I18nextProvider i18n={xpI18n}>
        <EventBusProvider bus={bus}>
          <DeductionSheet {...demoDeduction} />
        </EventBusProvider>
      </I18nextProvider>
    );

  const pick = (view: ReturnType<typeof mount>, slot: string, word: string) =>
    fireEvent.change(view.getByTestId(`slot-${slot}`), { target: { value: word } });

  it('verifies the correct group and fails the wrong one, in batches', () => {
    const view = mount();
    // Crime group correct; lookout wrong.
    pick(view, 'who', '阿哲');
    pick(view, 'weapon', '球棒');
    pick(view, 'where', '网吧');
    pick(view, 'lookout', '老板');
    fireEvent.click(view.getByTestId('deduction-verify'));

    const submit = events.find(e => e.type === 'deduction:submit');
    expect(submit).toMatchObject({ formId: 'county-finale' });
    const verified = events.find(e => e.type === 'deduction:verified') as Extract<XPEvent, { type: 'deduction:verified' }>;
    expect(verified.groups).toEqual(['the-crime']);
    const failed = events.find(e => e.type === 'deduction:failed') as Extract<XPEvent, { type: 'deduction:failed' }>;
    expect(failed.groups).toEqual(['the-lookout']);
  });

  it('locks a verified group and reaches the solved state', () => {
    const view = mount();
    pick(view, 'who', '阿哲');
    pick(view, 'weapon', '球棒');
    pick(view, 'where', '网吧');
    pick(view, 'lookout', '水晶女孩');
    fireEvent.click(view.getByTestId('deduction-verify'));

    // Both groups correct → solved banner, and a crime slot is now locked.
    expect(view.getByTestId('deduction-solved')).toBeTruthy();
    expect((view.getByTestId('slot-who') as HTMLSelectElement).disabled).toBe(true);
    expect(events.filter(e => e.type === 'deduction:verified').length).toBe(1);
    expect(events.some(e => e.type === 'deduction:failed')).toBe(false);
  });
});
