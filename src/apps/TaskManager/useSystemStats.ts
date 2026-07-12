import { useEffect, useRef, useState } from 'react';

/**
 * Simulated system telemetry for the Task Manager.
 *
 * None of this is real — it produces *plausible* XP-era numbers that drift
 * gently, updating roughly once per second so the status bar and the
 * Performance graphs feel alive without ever reflecting the host machine.
 */

const HISTORY_LEN = 60;

export interface SystemStats {
  /** Overall CPU usage 0–100 (integer). */
  cpuUsage: number;
  /** Rolling CPU history, oldest → newest, values 0–100. */
  cpuHistory: number[];
  /** Page-file usage 0–100, and its rolling history. */
  pfUsage: number;
  pfHistory: number[];
  /** Commit charge, in megabytes. */
  commitCurrentMB: number;
  commitLimitMB: number;
  commitPeakMB: number;
  /** Physical memory, in kilobytes. */
  physicalTotalKB: number;
  physicalAvailableKB: number;
  systemCacheKB: number;
  /** Totals (handles / threads / processes) shown on the Performance tab. */
  handleCount: number;
  threadCount: number;
  /** Monotonic tick — lets consumers derive per-row jitter deterministically. */
  tick: number;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/** Physical RAM the simulated box reports (~512 MB, classic XP). */
const PHYSICAL_TOTAL_KB = 523_760;
const COMMIT_LIMIT_MB = 1_270;

export const useSystemStats = (processCount: number): SystemStats => {
  const [stats, setStats] = useState<SystemStats>(() => ({
    cpuUsage: 3,
    cpuHistory: new Array(HISTORY_LEN).fill(3),
    pfUsage: 15,
    pfHistory: new Array(HISTORY_LEN).fill(15),
    commitCurrentMB: 196,
    commitLimitMB: COMMIT_LIMIT_MB,
    commitPeakMB: 214,
    physicalTotalKB: PHYSICAL_TOTAL_KB,
    physicalAvailableKB: 236_540,
    systemCacheKB: 158_220,
    handleCount: 7_284,
    threadCount: 372,
    tick: 0,
  }));

  // Track the latest process count without restarting the interval each render.
  const processCountRef = useRef(processCount);
  processCountRef.current = processCount;

  useEffect(() => {
    const timer = window.setInterval(() => {
      setStats(prev => {
        const procs = processCountRef.current;

        // CPU: mostly idle with the odd spike, biased by how many apps are open.
        const spike = Math.random() < 0.18 ? Math.random() * 45 : 0;
        const base = 2 + procs * 0.6 + Math.random() * 6;
        const cpuUsage = Math.round(clamp(base + spike, 0, 100));

        // Commit charge grows with open apps and jitters slightly.
        const commitCurrentMB = Math.round(
          clamp(178 + procs * 11 + (Math.random() * 8 - 4), 120, COMMIT_LIMIT_MB)
        );
        const commitPeakMB = Math.max(prev.commitPeakMB, commitCurrentMB);
        const pfUsage = Math.round(clamp((commitCurrentMB / COMMIT_LIMIT_MB) * 100, 0, 100));

        const physicalAvailableKB = Math.round(
          clamp(
            PHYSICAL_TOTAL_KB - 240_000 - procs * 9_000 + (Math.random() * 6_000 - 3_000),
            40_000,
            PHYSICAL_TOTAL_KB
          )
        );
        const systemCacheKB = Math.round(
          clamp(150_000 + (Math.random() * 16_000 - 8_000), 60_000, PHYSICAL_TOTAL_KB)
        );

        const cpuHistory = [...prev.cpuHistory.slice(1), cpuUsage];
        const pfHistory = [...prev.pfHistory.slice(1), pfUsage];

        return {
          ...prev,
          cpuUsage,
          cpuHistory,
          pfUsage,
          pfHistory,
          commitCurrentMB,
          commitPeakMB,
          physicalAvailableKB,
          systemCacheKB,
          handleCount: 7_000 + procs * 120 + Math.round(Math.random() * 60),
          threadCount: 340 + procs * 9 + Math.round(Math.random() * 8),
          tick: prev.tick + 1,
        } as SystemStats;
      });
    }, 1_000);

    return () => window.clearInterval(timer);
  }, []);

  return stats;
};
