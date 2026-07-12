import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../constants';
import type { SystemStats } from './useSystemStats';
import {
  PerfGrid,
  GraphBox,
  SmallGraph,
  WideGraph,
  GraphCanvas,
  Readout,
  StatsRow,
  StatsBox,
  StatsLine,
} from './styled';

interface PerformanceProps {
  stats: SystemStats;
  processCount: number;
}

/** Draw the classic green grid onto a black panel. */
const drawGrid = (ctx: CanvasRenderingContext2D, w: number, h: number, offset = 0) => {
  ctx.fillStyle = COLORS.BLACK;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = COLORS.PERF_GRAPH_GRID;
  ctx.lineWidth = 1;
  const step = 12;
  ctx.beginPath();
  for (let x = w - offset; x >= 0; x -= step) {
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, h);
  }
  for (let y = h; y >= 0; y -= step) {
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(w, y + 0.5);
  }
  ctx.stroke();
};

/** Green polyline waveform + filled area, scrolling right-to-left. */
const drawHistory = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  history: number[],
  scrollOffset: number
) => {
  drawGrid(ctx, w, h, scrollOffset);

  const n = history.length;
  if (n < 2) return;
  const dx = w / (n - 1);

  ctx.beginPath();
  history.forEach((value, i) => {
    const x = i * dx;
    const y = h - (value / 100) * h;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  // Filled area under the line (translucent green — not a token, no hex here).
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fillStyle = 'rgba(0, 255, 0, 0.18)';
  ctx.fill();

  ctx.beginPath();
  history.forEach((value, i) => {
    const x = i * dx;
    const y = h - (value / 100) * h;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = COLORS.PERF_GRAPH_LINE;
  ctx.lineWidth = 1;
  ctx.stroke();
};

/** A tall vertical bar meter (CPU Usage / PF Usage columns). */
const drawMeter = (ctx: CanvasRenderingContext2D, w: number, h: number, value: number) => {
  drawGrid(ctx, w, h);
  const filled = (value / 100) * h;
  ctx.fillStyle = 'rgba(0, 255, 0, 0.35)';
  ctx.fillRect(0, h - filled, w, filled);
  // Bright cap line at the top of the fill.
  ctx.strokeStyle = COLORS.PERF_GRAPH_LINE;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, h - filled + 0.5);
  ctx.lineTo(w, h - filled + 0.5);
  ctx.stroke();
};

const useMeterCanvas = (value: number) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawMeter(ctx, canvas.width, canvas.height, value);
  }, [value]);
  return ref;
};

const useHistoryCanvas = (history: number[]) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const scrollRef = useRef(0);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // Advance the grid phase a little each update so it visibly scrolls.
    scrollRef.current = (scrollRef.current + 4) % 12;
    drawHistory(ctx, canvas.width, canvas.height, history, scrollRef.current);
  }, [history]);
  return ref;
};

const Performance: React.FC<PerformanceProps> = ({ stats, processCount }) => {
  const { t, i18n } = useTranslation();
  const cpuMeterRef = useMeterCanvas(stats.cpuUsage);
  const cpuHistoryRef = useHistoryCanvas(stats.cpuHistory);
  const pfMeterRef = useMeterCanvas(stats.pfUsage);
  const pfHistoryRef = useHistoryCanvas(stats.pfHistory);

  const nf = new Intl.NumberFormat(i18n.language);
  const commitK = `${nf.format(stats.commitCurrentMB * 1024)} K`;

  return (
    <PerfGrid data-testid="taskmgr-performance">
      <GraphBox>
        <legend>{t('taskManager.perf.cpuUsage')}</legend>
        <SmallGraph>
          <GraphCanvas ref={cpuMeterRef} width={60} height={80} />
          <Readout>{stats.cpuUsage}%</Readout>
        </SmallGraph>
      </GraphBox>

      <GraphBox>
        <legend>{t('taskManager.perf.cpuUsageHistory')}</legend>
        <WideGraph>
          <GraphCanvas ref={cpuHistoryRef} width={240} height={80} />
        </WideGraph>
      </GraphBox>

      <GraphBox>
        <legend>{t('taskManager.perf.pfUsage')}</legend>
        <SmallGraph>
          <GraphCanvas ref={pfMeterRef} width={60} height={80} />
          <Readout>{commitK}</Readout>
        </SmallGraph>
      </GraphBox>

      <GraphBox>
        <legend>{t('taskManager.perf.pageFileUsageHistory')}</legend>
        <WideGraph>
          <GraphCanvas ref={pfHistoryRef} width={240} height={80} />
        </WideGraph>
      </GraphBox>

      <StatsRow>
        <StatsBox>
          <legend>{t('taskManager.perf.totals')}</legend>
          <StatsLine>
            <span>{t('taskManager.perf.handles')}</span>
            <span>{nf.format(stats.handleCount)}</span>
          </StatsLine>
          <StatsLine>
            <span>{t('taskManager.perf.threads')}</span>
            <span>{nf.format(stats.threadCount)}</span>
          </StatsLine>
          <StatsLine>
            <span>{t('taskManager.perf.processes')}</span>
            <span>{nf.format(processCount)}</span>
          </StatsLine>
        </StatsBox>

        <StatsBox>
          <legend>{t('taskManager.perf.commitCharge')}</legend>
          <StatsLine>
            <span>{t('taskManager.perf.total')}</span>
            <span>{nf.format(stats.commitCurrentMB * 1024)}</span>
          </StatsLine>
          <StatsLine>
            <span>{t('taskManager.perf.limit')}</span>
            <span>{nf.format(stats.commitLimitMB * 1024)}</span>
          </StatsLine>
          <StatsLine>
            <span>{t('taskManager.perf.peak')}</span>
            <span>{nf.format(stats.commitPeakMB * 1024)}</span>
          </StatsLine>
        </StatsBox>

        <StatsBox>
          <legend>{t('taskManager.perf.physicalMemory')}</legend>
          <StatsLine>
            <span>{t('taskManager.perf.total')}</span>
            <span>{nf.format(stats.physicalTotalKB)}</span>
          </StatsLine>
          <StatsLine>
            <span>{t('taskManager.perf.available')}</span>
            <span>{nf.format(stats.physicalAvailableKB)}</span>
          </StatsLine>
          <StatsLine>
            <span>{t('taskManager.perf.systemCache')}</span>
            <span>{nf.format(stats.systemCacheKB)}</span>
          </StatsLine>
        </StatsBox>

        <StatsBox>
          <legend>{t('taskManager.perf.kernelMemory')}</legend>
          <StatsLine>
            <span>{t('taskManager.perf.total')}</span>
            <span>{nf.format(Math.round(stats.physicalTotalKB * 0.09))}</span>
          </StatsLine>
          <StatsLine>
            <span>{t('taskManager.perf.paged')}</span>
            <span>{nf.format(Math.round(stats.physicalTotalKB * 0.06))}</span>
          </StatsLine>
          <StatsLine>
            <span>{t('taskManager.perf.nonpaged')}</span>
            <span>{nf.format(Math.round(stats.physicalTotalKB * 0.012))}</span>
          </StatsLine>
        </StatsBox>
      </StatsRow>
    </PerfGrid>
  );
};

export default Performance;
