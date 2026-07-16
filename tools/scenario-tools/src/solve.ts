import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { ContentPack, ContentRef } from '../../../src/content/types';
import {
  compilePuzzleGraph,
  solvedFlag,
  type PuzzleGraph,
} from '../../../src/scenario/puzzleGraph';
import { buildTape } from '../../../src/scenario/rehearsal';
import { solveScenario, type SolveFsNode, type SolveResult } from '../../../src/scenario/solver';
import type { FlagValue, Scenario } from '../../../src/scenario/types';
import type { FileNode } from '../../../src/types';
import type { AuthoringKind, AuthoringValue } from './types';

export interface SolveExpectation {
  flag: string;
  value?: FlagValue;
}

export interface SolveStep {
  index: number;
  event: string;
  beat?: string;
  fired: string[];
}

export interface ScenarioSolveReport {
  ok: boolean;
  scenarioId: string;
  steps: SolveStep[];
  result: SolveResult;
  expectedFlags: Record<string, FlagValue>;
  missing: string[];
  providerFallbacks: number;
}

export interface ToolSolveOptions {
  events?: Parameters<typeof solveScenario>[1];
  fs?: SolveFsNode[];
  expect?: SolveExpectation[];
  baseDir?: string;
}

const isContainer = (node: FileNode): node is FileNode & { children: Record<string, FileNode> } =>
  'children' in node && typeof node.children === 'object' && node.children !== null;

const resolveSeedContent = async (
  ref: ContentRef | undefined,
  assets: Record<string, ContentRef>,
  baseDir: string | undefined,
  seen = new Set<string>()
): Promise<string | undefined> => {
  if (ref === undefined) return undefined;
  if (typeof ref === 'string') return ref;
  if ('asset' in ref) {
    if (seen.has(ref.asset)) return undefined;
    seen.add(ref.asset);
    return resolveSeedContent(assets[ref.asset], assets, baseDir, seen);
  }
  if (!baseDir || /^(?:[a-z]+:)?\/\//i.test(ref.url) || ref.url.startsWith('data:'))
    return undefined;
  return readFile(path.resolve(baseDir, ref.url), 'utf8').catch(() => undefined);
};

const packFsSeeds = async (pack: ContentPack, baseDir?: string): Promise<SolveFsNode[]> => {
  const seeds: SolveFsNode[] = [];
  const assets = pack.assets ?? {};
  const visit = async (nodes: Record<string, FileNode>, prefix: string[]): Promise<void> => {
    for (const [key, node] of Object.entries(nodes)) {
      const current = [...prefix, key];
      const content =
        'content' in node && typeof node.content === 'string'
          ? node.content
          : 'contentRef' in node
            ? await resolveSeedContent(node.contentRef, assets, baseDir)
            : undefined;
      seeds.push({
        path: current,
        locked: node.locked ?? false,
        ...(content !== undefined ? { content } : {}),
      });
      if (isContainer(node)) await visit(node.children, current);
    }
  };
  await visit(pack.files ?? {}, []);
  return seeds;
};

const fireDelta = (before: Record<string, number>, after: Record<string, number>): string[] =>
  Object.keys(after).filter(key => (after[key] ?? 0) > (before[key] ?? 0));

const countProviderFallbacks = (value: unknown): number => {
  let count = 0;
  const visit = (item: unknown): void => {
    if (Array.isArray(item)) item.forEach(visit);
    else if (item && typeof item === 'object') {
      const record = item as Record<string, unknown>;
      if (
        record.provider === 'chat' &&
        Array.isArray(record.fallback) &&
        record.fallback.length > 0
      ) {
        count += 1;
      }
      Object.values(record).forEach(visit);
    }
  };
  visit(value);
  return count;
};

export const solveAuthoredValue = async (
  kind: AuthoringKind,
  value: AuthoringValue,
  options: ToolSolveOptions = {}
): Promise<ScenarioSolveReport> => {
  let scenario: Scenario;
  let graph: PuzzleGraph | undefined;
  let pack: ContentPack | undefined;
  if (kind === 'graph') {
    graph = value as PuzzleGraph;
    scenario = compilePuzzleGraph(graph);
  } else if (kind === 'pack') {
    pack = value as ContentPack;
    if (!pack.scenario) throw new Error('content pack does not declare a scenario');
    scenario = pack.scenario;
  } else {
    scenario = value as Scenario;
  }

  const tape = buildTape(scenario.rehearsal);
  const events = options.events ?? tape.events;
  if (events.length === 0) {
    throw new Error('scenario has no rehearsal walkthrough; pass an explicit event tape');
  }
  const fs = options.fs ?? (pack ? await packFsSeeds(pack, options.baseDir) : undefined);

  const steps: SolveStep[] = [];
  let previous: SolveResult = {
    flags: { ...(scenario.initialFlags ?? {}) },
    journal: [],
    fired: {},
    actions: [],
  };
  for (let index = 0; index < events.length; index += 1) {
    const current = solveScenario(scenario, events.slice(0, index + 1), fs ? { fs } : {});
    const beat = scenario.rehearsal?.walkthrough[index]?.beat;
    steps.push({
      index: index + 1,
      event: events[index].type,
      ...(beat ? { beat } : {}),
      fired: fireDelta(previous.fired, current.fired),
    });
    previous = current;
  }

  const result = previous;
  const expected = new Map<string, FlagValue>();
  graph?.puzzles.forEach(puzzle => expected.set(solvedFlag(puzzle.id), true));
  options.expect?.forEach(item => expected.set(item.flag, item.value ?? true));
  const missing: string[] = [];
  expected.forEach((expectedValue, flag) => {
    if (result.flags[flag] !== expectedValue) {
      missing.push(
        `${flag}=${JSON.stringify(expectedValue)} (got ${JSON.stringify(result.flags[flag])})`
      );
    }
  });
  if (expected.size === 0 && steps[steps.length - 1]?.fired.length === 0) {
    missing.push(
      'the final walkthrough step did not fire a trigger; declare --expect flag=value for an explicit finale'
    );
  }

  return {
    ok: missing.length === 0,
    scenarioId: scenario.id,
    steps,
    result,
    expectedFlags: Object.fromEntries(expected),
    missing,
    providerFallbacks: countProviderFallbacks(value),
  };
};
