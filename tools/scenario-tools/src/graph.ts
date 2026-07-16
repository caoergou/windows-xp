import type { ContentPack } from '../../../src/content/types';
import { lintPuzzleGraph, type PuzzleGraph } from '../../../src/scenario/puzzleGraph';
import type { Scenario } from '../../../src/scenario/types';
import type { AuthoringKind, AuthoringValue } from './types';
import { collectActionFlags, collectConditionFlags, contentRefAt, walkValue } from './walk';

export type GraphFormat = 'mermaid' | 'dot' | 'json';

export interface ToolGraphNode {
  id: string;
  label: string;
  kind: 'puzzle' | 'trigger' | 'asset' | 'content';
  gate?: boolean;
}

export interface ToolGraphEdge {
  from: string;
  to: string;
  label?: string;
  kind: 'dependency' | 'flag' | 'content-ref';
}

export interface ToolGraph {
  id: string;
  nodes: ToolGraphNode[];
  edges: ToolGraphEdge[];
  bushiness?: number[];
  maxParallel?: number;
}

const scenarioGraph = (scenario: Scenario): ToolGraph => {
  const nodes: ToolGraphNode[] = scenario.triggers.map((trigger, index) => ({
    id: `trigger:${index}`,
    label:
      trigger.id ?? `${Array.isArray(trigger.on) ? trigger.on.join('|') : trigger.on} #${index}`,
    kind: 'trigger',
  }));
  const producers = new Map<string, string[]>();
  scenario.triggers.forEach((trigger, index) => {
    collectActionFlags(trigger.do).forEach(flag => {
      const list = producers.get(flag) ?? [];
      list.push(`trigger:${index}`);
      producers.set(flag, list);
    });
  });
  const edges: ToolGraphEdge[] = [];
  scenario.triggers.forEach((trigger, index) => {
    collectConditionFlags(trigger.when).forEach(flag => {
      (producers.get(flag) ?? []).forEach(from => {
        edges.push({ from, to: `trigger:${index}`, label: flag, kind: 'flag' });
      });
    });
  });
  return { id: scenario.id, nodes, edges };
};

const puzzleGraph = (graph: PuzzleGraph): ToolGraph => {
  const report = lintPuzzleGraph(graph);
  return {
    id: graph.id,
    nodes: graph.puzzles.map(puzzle => ({
      id: `puzzle:${puzzle.id}`,
      label: puzzle.id,
      kind: 'puzzle',
      ...(puzzle.gate ? { gate: true } : {}),
    })),
    edges: graph.puzzles.flatMap(puzzle =>
      (puzzle.requires ?? []).map(required => ({
        from: `puzzle:${required}`,
        to: `puzzle:${puzzle.id}`,
        kind: 'dependency' as const,
      }))
    ),
    bushiness: report.bushiness,
    maxParallel: report.maxParallel,
  };
};

const packGraph = (pack: ContentPack): ToolGraph => {
  const base = pack.scenario
    ? scenarioGraph(pack.scenario)
    : ({ id: pack.id, nodes: [], edges: [] } satisfies ToolGraph);
  Object.keys(pack.assets ?? {}).forEach(key => {
    base.nodes.push({ id: `asset:${key}`, label: key, kind: 'asset' });
  });
  const seenContent = new Set<string>();
  walkValue({ sites: pack.sites, files: pack.files }, ({ value, path }) => {
    const ref = contentRefAt(value);
    if (!ref || typeof ref === 'string' || !('asset' in ref)) return;
    const owner = path.replace(/\.(html|favicon|contentRef)$/, '');
    const ownerId = `content:${owner}`;
    if (!seenContent.has(ownerId)) {
      seenContent.add(ownerId);
      base.nodes.push({ id: ownerId, label: owner.replace(/^\$\./, ''), kind: 'content' });
    }
    base.edges.push({ from: ownerId, to: `asset:${ref.asset}`, kind: 'content-ref' });
  });
  base.id = pack.id;
  return base;
};

export const buildAuthoringGraph = (kind: AuthoringKind, value: AuthoringValue): ToolGraph => {
  if (kind === 'graph') return puzzleGraph(value as PuzzleGraph);
  if (kind === 'pack') return packGraph(value as ContentPack);
  return scenarioGraph(value as Scenario);
};

const escapeLabel = (value: string): string => value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

const renderMermaid = (graph: ToolGraph): string => {
  const ids = new Map(graph.nodes.map((node, index) => [node.id, `n${index}`]));
  const lines = ['graph TD'];
  if (graph.bushiness)
    lines.push(
      `  %% bushiness: ${graph.bushiness.join(' -> ')}; max parallel: ${graph.maxParallel ?? 0}`
    );
  graph.nodes.forEach(node => {
    lines.push(`  ${ids.get(node.id)}["${escapeLabel(node.label)}"]${node.gate ? ':::gate' : ''}`);
  });
  graph.edges.forEach(edge => {
    const from = ids.get(edge.from);
    const to = ids.get(edge.to);
    if (!from || !to) return;
    lines.push(`  ${from} -->${edge.label ? `|${escapeLabel(edge.label)}|` : ''} ${to}`);
  });
  if (graph.nodes.some(node => node.gate)) {
    lines.push('  classDef gate fill:#fff2cc,stroke:#996600,stroke-width:2px');
  }
  return `${lines.join('\n')}\n`;
};

const renderDot = (graph: ToolGraph): string => {
  const ids = new Map(graph.nodes.map((node, index) => [node.id, `n${index}`]));
  const lines = [`digraph "${escapeLabel(graph.id)}" {`];
  graph.nodes.forEach(node => {
    lines.push(
      `  ${ids.get(node.id)} [label="${escapeLabel(node.label)}"${node.gate ? ', shape=doubleoctagon' : ''}];`
    );
  });
  graph.edges.forEach(edge => {
    const from = ids.get(edge.from);
    const to = ids.get(edge.to);
    if (from && to)
      lines.push(`  ${from} -> ${to}${edge.label ? ` [label="${escapeLabel(edge.label)}"]` : ''};`);
  });
  lines.push('}');
  return `${lines.join('\n')}\n`;
};

export const renderAuthoringGraph = (graph: ToolGraph, format: GraphFormat = 'mermaid'): string => {
  if (format === 'json') return `${JSON.stringify(graph, null, 2)}\n`;
  return format === 'dot' ? renderDot(graph) : renderMermaid(graph);
};
