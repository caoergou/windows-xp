import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import EvidenceReport from '../src/apps/EvidenceReport';
import { judgeClaim, type ReportClaim } from '../src/apps/EvidenceReport/logic';
import { EventBusProvider } from '../src/context/EventBusContext';
import { XPEventBus, type XPEvent } from '../src/events';
import { evaluateCondition } from '../src/scenario/engine';

const claim: ReportClaim = {
  id: 'timeline',
  prompt: 'The file predates the print job.',
  minEvidence: 1,
  solution: { confidence: 'proven', evidenceIds: ['file-time'] },
};

describe('Evidence Report (#278)', () => {
  beforeEach(() => localStorage.clear());

  it('distinguishes supported, under-supported and conflicted claims', () => {
    expect(
      judgeClaim(claim, { claimId: 'timeline', confidence: 'proven', evidenceIds: ['file-time'] })
    ).toBe('supported');
    expect(judgeClaim(claim, { claimId: 'timeline', confidence: 'proven', evidenceIds: [] })).toBe(
      'under-supported'
    );
    expect(
      judgeClaim(
        { ...claim, conflicts: [{ evidenceId: 'bad-clock' }] },
        { claimId: 'timeline', confidence: 'proven', evidenceIds: ['bad-clock'] }
      )
    ).toBe('conflicted');
  });

  it('submits citations, renders review and supports scenario claim gates', () => {
    const bus = new XPEventBus();
    const events: XPEvent[] = [];
    bus.subscribe(event => events.push(event));
    render(
      <EventBusProvider bus={bus}>
        <EvidenceReport
          reportId="final"
          claims={[claim]}
          evidence={[{ id: 'file-time', label: 'File timestamps' }]}
        />
      </EventBusProvider>
    );
    fireEvent.change(screen.getByLabelText('Confidence'), { target: { value: 'proven' } });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByText('Submit Report'));
    expect(screen.getByTestId('claim-result-timeline')).toHaveTextContent(
      'Supported by the cited evidence'
    );
    const resultEvent = events.find(event => event.type === 'deduction:claim-result');
    expect(resultEvent).toMatchObject({
      reportId: 'final',
      claimId: 'timeline',
      result: 'supported',
    });
    expect(
      evaluateCondition(
        { reportClaim: { reportId: 'final', claimId: 'timeline', result: 'supported' } },
        {
          flags: {},
          event: resultEvent as XPEvent,
          journal: events,
          fs: { exists: () => false, unlocked: () => false, content: () => null },
        }
      )
    ).toBe(true);
  });
});
