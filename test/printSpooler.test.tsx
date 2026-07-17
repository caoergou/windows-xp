import React from 'react';
import { act, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StorageProvider } from '../src/context/StorageContext';
import { EventBusProvider } from '../src/context/EventBusContext';
import { ClockProvider } from '../src/context/ClockContext';
import {
  PrintSpoolerProvider,
  usePrintSpooler,
  type PrintSpoolerApi,
} from '../src/context/PrintSpoolerContext';
import { XPEventBus, type XPEvent } from '../src/events';

describe('print spooler (#276)', () => {
  it('adds, updates and cancels jobs with virtual time and stable events', () => {
    localStorage.clear();
    const bus = new XPEventBus();
    const events: XPEvent[] = [];
    bus.subscribe(event => events.push(event));
    let api: PrintSpoolerApi | undefined;
    const Probe = () => {
      api = usePrintSpooler();
      return null;
    };
    render(
      <StorageProvider prefix="print_test_" persistence="local">
        <EventBusProvider bus={bus}>
          <ClockProvider config={{ initialTime: '2016-02-17T13:03:00Z', mode: 'frozen' }}>
            <PrintSpoolerProvider printers={[{ id: 'laser', name: 'LaserJet' }]}>
              <Probe />
            </PrintSpoolerProvider>
          </ClockProvider>
        </EventBusProvider>
      </StorageProvider>
    );
    act(() =>
      api?.addJob({
        id: 'job-1',
        documentName: 'report.doc',
        printerId: 'laser',
        status: 'queued',
      })
    );
    expect(api?.jobs[0].submittedAt).toBe('2016-02-17T13:03:00.000Z');
    act(() => api?.updateJob('job-1', { status: 'paused' }));
    expect(api?.jobs[0].status).toBe('paused');
    act(() => api?.removeJob('job-1'));
    expect(api?.jobs).toEqual([]);
    expect(events.map(event => event.type)).toEqual([
      'print:job-update',
      'print:job-update',
      'print:job-cancel',
    ]);
  });

  it('keeps authored history read-only', () => {
    let api: PrintSpoolerApi | undefined;
    const Probe = () => {
      api = usePrintSpooler();
      return null;
    };
    render(
      <StorageProvider prefix="print_readonly_" persistence="none">
        <EventBusProvider bus={new XPEventBus()}>
          <ClockProvider>
            <PrintSpoolerProvider
              jobs={[
                {
                  id: 'history',
                  documentName: 'old.txt',
                  submittedAt: '2010-01-01T00:00:00Z',
                  printerId: 'p',
                  status: 'completed',
                  readOnly: true,
                },
              ]}
            >
              <Probe />
            </PrintSpoolerProvider>
          </ClockProvider>
        </EventBusProvider>
      </StorageProvider>
    );
    act(() => api?.removeJob('history'));
    expect(api?.jobs).toHaveLength(1);
  });
});
