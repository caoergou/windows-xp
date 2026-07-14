import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { ProcessRow } from './data';
import type { SystemStats } from './useSystemStats';
import { ProcTable, ProcHead, ProcRow } from './styled';

interface ProcessesProps {
  rows: ProcessRow[];
  stats: SystemStats;
  selectedKey: string | null;
  onSelect: (key: string) => void;
}

/** Small stable hash so a process keeps roughly the same figures over time. */
const hash = (input: string): number => {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 0xffffffff;
};

const pad2 = (value: number): string => value.toString().padStart(2, '0');

interface RowFigures {
  cpu: string;
  memKB: number;
}

const computeFigures = (row: ProcessRow, stats: SystemStats, cpuRemainder: number): RowFigures => {
  if (row.imageName === 'System Idle Process') {
    return { cpu: pad2(cpuRemainder), memKB: 28 };
  }

  // Deterministic base memory per process, jittered a touch each tick.
  const base = 1_800 + Math.floor(hash(row.imageName + row.key) * 26_000);
  const jitter = Math.floor((hash(row.key + stats.tick) - 0.5) * 240);
  const memKB = Math.max(300, base + jitter);

  // Most processes idle at 00; a few show a small share, driven by the tick.
  const share = hash(row.key + 'cpu' + Math.floor(stats.tick / 2));
  let cpu = 0;
  if (share > 0.93) cpu = Math.min(6, Math.ceil(stats.cpuUsage * 0.5));
  else if (share > 0.82) cpu = 1;
  return { cpu: pad2(cpu), memKB };
};

const Processes: React.FC<ProcessesProps> = ({ rows, stats, selectedKey, onSelect }) => {
  const { t, i18n } = useTranslation();
  const nf = useMemo(() => new Intl.NumberFormat(i18n.language), [i18n.language]);

  const cpuRemainder = Math.max(0, 100 - stats.cpuUsage);

  return (
    <ProcTable data-testid="taskmgr-processes-table">
      <ProcHead>
        <tr>
          <th style={{ width: '40%' }}>{t('taskManager.columns.imageName')}</th>
          <th style={{ width: '28%' }}>{t('taskManager.columns.userName')}</th>
          <th style={{ width: '12%' }}>{t('taskManager.columns.cpu')}</th>
          <th style={{ width: '20%' }}>{t('taskManager.columns.memUsage')}</th>
        </tr>
      </ProcHead>
      <tbody>
        {rows.map(row => {
          const { cpu, memKB } = computeFigures(row, stats, cpuRemainder);
          return (
            <ProcRow
              key={row.key}
              $selected={selectedKey === row.key}
              onClick={() => onSelect(row.key)}
              data-testid={`taskmgr-process-${row.key}`}
            >
              <td>{row.imageName}</td>
              <td>{row.userName}</td>
              <td className="num">{cpu}</td>
              <td className="num">{`${nf.format(memKB)} K`}</td>
            </ProcRow>
          );
        })}
      </tbody>
    </ProcTable>
  );
};

export default Processes;
