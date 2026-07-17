import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useStorage } from './StorageContext';
import { useXPEventBus } from './EventBusContext';
import { useClock } from './ClockContext';

export type PrintJobStatus =
  | 'queued'
  | 'printing'
  | 'paused'
  | 'error'
  | 'completed'
  | 'deleted'
  | 'orphaned';

export interface PrinterDefinition {
  id: string;
  name: string;
  location?: string;
  isDefault?: boolean;
}

export interface PrintJob {
  id: string;
  documentName: string;
  owner?: string;
  submittedAt: string;
  printerId: string;
  status: PrintJobStatus;
  pages?: number;
  sizeBytes?: number;
  sourcePath?: string[];
  spoolFileName?: string;
  note?: string;
  readOnly?: boolean;
}

export interface PrintSpoolerApi {
  printers: PrinterDefinition[];
  jobs: PrintJob[];
  addJob: (job: Omit<PrintJob, 'submittedAt'> & { submittedAt?: string }) => void;
  updateJob: (id: string, updates: Partial<PrintJob>) => void;
  removeJob: (id: string) => void;
  openQueue: (printerId: string) => void;
  openJob: (id: string) => void;
}

const PrintSpoolerContext = createContext<PrintSpoolerApi | undefined>(undefined);

export const PrintSpoolerProvider: React.FC<{
  children: React.ReactNode;
  printers?: PrinterDefinition[];
  jobs?: PrintJob[];
}> = ({ children, printers = [], jobs: initialJobs = [] }) => {
  const storage = useStorage();
  const bus = useXPEventBus();
  const clock = useClock();
  const key = storage.key('print_jobs');
  const [jobs, setJobs] = useState<PrintJob[]>(() => {
    try {
      const saved = storage.local.getItem(key);
      if (saved) return JSON.parse(saved) as PrintJob[];
    } catch {
      // Ignore malformed legacy spool data.
    }
    return initialJobs;
  });

  useEffect(() => storage.local.setItem(key, JSON.stringify(jobs)), [jobs, key, storage]);

  const addJob = useCallback(
    (job: Omit<PrintJob, 'submittedAt'> & { submittedAt?: string }) => {
      const next = { ...job, submittedAt: job.submittedAt ?? clock.now() };
      setJobs(previous => [...previous.filter(item => item.id !== next.id), next]);
      bus.emit({
        type: 'print:job-update',
        jobId: next.id,
        printerId: next.printerId,
        status: next.status,
      });
    },
    [bus, clock]
  );
  const updateJob = useCallback(
    (id: string, updates: Partial<PrintJob>) => {
      setJobs(previous =>
        previous.map(job => {
          if (job.id !== id || job.readOnly) return job;
          const next = { ...job, ...updates, id: job.id };
          bus.emit({
            type: updates.status === 'deleted' ? 'print:job-cancel' : 'print:job-update',
            jobId: id,
            printerId: next.printerId,
            status: next.status,
          });
          return next;
        })
      );
    },
    [bus]
  );
  const removeJob = useCallback(
    (id: string) => {
      const job = jobs.find(item => item.id === id);
      if (!job || job.readOnly) return;
      setJobs(previous => previous.filter(item => item.id !== id));
      bus.emit({
        type: 'print:job-cancel',
        jobId: id,
        printerId: job.printerId,
        status: 'deleted',
      });
    },
    [bus, jobs]
  );
  const openQueue = useCallback(
    (printerId: string) => bus.emit({ type: 'print:queue-open', printerId }),
    [bus]
  );
  const openJob = useCallback(
    (id: string) => {
      const job = jobs.find(item => item.id === id);
      if (job) bus.emit({ type: 'print:job-open', jobId: id, printerId: job.printerId });
    },
    [bus, jobs]
  );
  const value = useMemo(
    () => ({ printers, jobs, addJob, updateJob, removeJob, openQueue, openJob }),
    [addJob, jobs, openJob, openQueue, printers, removeJob, updateJob]
  );
  return <PrintSpoolerContext.Provider value={value}>{children}</PrintSpoolerContext.Provider>;
};

export const usePrintSpooler = (): PrintSpoolerApi => {
  const value = useContext(PrintSpoolerContext);
  if (!value) throw new Error('usePrintSpooler must be used inside PrintSpoolerProvider.');
  return value;
};
