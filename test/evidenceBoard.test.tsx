/**
 * Evidence Board (#219): the journal-derived `pinned`/`linked` predicates, the
 * app emitting `evidence:pin`/`link`/`unpin`, and a scenario gating on `linked`.
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { describe, it, expect, beforeEach } from 'vitest';
import { evaluateCondition, type EvalContext } from '../src/scenario/engine';
import { defineScenario, linked, setFlag } from '../src/scenario/builder';
import { solveScenario } from '../src/scenario/solver';
import EvidenceBoard from '../src/apps/EvidenceBoard';
import { demoEvidence } from '../src/data/scenarios/evidenceDemo';
import xpI18n from '../src/i18n';
import { XPEventBus, type XPEvent } from '../src/events';
import { EventBusProvider } from '../src/context/EventBusContext';

const ctx = (journal: XPEvent[]): EvalContext => ({
  flags: {},
  journal,
  fs: { exists: () => false, unlocked: () => false, content: () => null },
});

const pin = (id: string): XPEvent => ({ type: 'evidence:pin', itemId: id });
const unpin = (id: string): XPEvent => ({ type: 'evidence:unpin', itemId: id });
const link = (a: string, b: string): XPEvent => ({
  type: 'evidence:link',
  sourceId: a,
  targetId: b,
});

describe('evidence predicates (journal-derived)', () => {
  it('pinned tracks pin/unpin net count', () => {
    expect(evaluateCondition({ pinned: 'x' }, ctx([pin('x')]))).toBe(true);
    expect(evaluateCondition({ pinned: 'x' }, ctx([pin('x'), unpin('x')]))).toBe(false);
    expect(evaluateCondition({ pinned: 'x' }, ctx([pin('x'), unpin('x'), pin('x')]))).toBe(true);
  });

  it('linked needs a link and both items still pinned; is order-insensitive', () => {
    const j = [pin('a'), pin('b'), link('a', 'b')];
    expect(evaluateCondition({ linked: { a: 'a', b: 'b' } }, ctx(j))).toBe(true);
    expect(evaluateCondition({ linked: { a: 'b', b: 'a' } }, ctx(j))).toBe(true);
    // Unpinning one end invalidates the link.
    expect(evaluateCondition({ linked: { a: 'a', b: 'b' } }, ctx([...j, unpin('a')]))).toBe(false);
    // A link with no prior pins doesn't hold.
    expect(evaluateCondition({ linked: { a: 'a', b: 'b' } }, ctx([link('a', 'b')]))).toBe(false);
  });
});

describe('EvidenceBoard app emits evidence:*', () => {
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
          <EvidenceBoard {...demoEvidence} />
        </EventBusProvider>
      </I18nextProvider>
    );

  it('pins, links, and unpins', () => {
    const view = mount();
    fireEvent.click(view.getByTestId('tray-diary'));
    fireEvent.click(view.getByTestId('tray-chatlog'));
    expect(
      events.filter(e => e.type === 'evidence:pin').map(e => (e as { itemId: string }).itemId)
    ).toEqual(['diary', 'chatlog']);

    // Link the two pinned cards.
    fireEvent.click(view.getByTestId('card-diary'));
    fireEvent.click(view.getByTestId('card-chatlog'));
    const linkEv = events.find(e => e.type === 'evidence:link') as Extract<
      XPEvent,
      { type: 'evidence:link' }
    >;
    expect(linkEv).toMatchObject({ sourceId: 'diary', targetId: 'chatlog' });

    // Unpin one.
    fireEvent.click(view.getByTestId('unpin-diary'));
    expect(
      events.some(e => e.type === 'evidence:unpin' && (e as { itemId: string }).itemId === 'diary')
    ).toBe(true);
  });
});

describe('scenario gates on linked()', () => {
  it('fires only once the two items are pinned and linked', () => {
    const s = defineScenario('board');
    s.on('cmd:exec').when(linked('diary', 'chatlog')).do(setFlag('connected'));
    const scenario = s.build();
    const trigger: XPEvent = { type: 'cmd:exec', command: 'check' };

    const before = solveScenario(scenario, [trigger]);
    expect(before.flags.connected).toBeUndefined();

    const after = solveScenario(scenario, [
      pin('diary'),
      pin('chatlog'),
      link('diary', 'chatlog'),
      trigger,
    ]);
    expect(after.flags.connected).toBe(true);
  });
});
