import path from 'node:path';
import { readFile } from 'node:fs/promises';
import type { ContentPack } from '../../../src/content/types';
import { compilePuzzleGraph } from '../../../src/scenario/puzzleGraph';
import { buildTape } from '../../../src/scenario/rehearsal';
import type { Scenario } from '../../../src/scenario/types';
import { buildAuthoringGraph } from './graph';
import { lintValue } from './lint';
import { normalizeContentPack } from './pack';
import { collectBuddies, isRecord, replyTexts } from './serveChat';
import {
  attachDiagnosticSource,
  AUTHORING_PROTOCOL_VERSION,
  type AuthoringSnapshot,
  type ReloadSnapshot,
} from './serveProtocol';
import { solveAuthoredValue } from './solve';
import type { Diagnostic, LoadedInput } from './types';
import { collectFlagUsage } from './walk';

const DIAGNOSTIC_HELP: Record<string, string> = {
  'unknown-event': 'Choose an event type from the engine event catalog or correct the spelling.',
  'broken-asset':
    'Declare the referenced key in the pack asset manifest or update the content reference.',
  'missing-file': 'Restore the local asset file or change its manifest URL.',
  'orphan-asset': 'Reference the asset from authored content or remove it from the manifest.',
  'provider-fallback':
    'Add a deterministic fallback so offline and failed-provider runs remain coherent.',
};

const sourceDiagnostics = async (
  input: LoadedInput,
  diagnostics: Diagnostic[]
): Promise<Diagnostic[]> => {
  const sourced = attachDiagnosticSource(diagnostics, input.file).map(item => ({
    ...item,
    ...(item.help || !DIAGNOSTIC_HELP[item.code] ? {} : { help: DIAGNOSTIC_HELP[item.code] }),
  }));
  if (path.extname(input.file).toLowerCase() !== '.json') return sourced;
  const text = await readFile(input.file, 'utf8').catch(() => '');
  return sourced.map(item => {
    if (!item.path || item.range) return item;
    const segments = [...item.path.matchAll(/(?:^\$\.|\.)([^.[\]]+)|\["([^"]+)"\]/g)]
      .map(match => match[1] ?? match[2])
      .filter(Boolean);
    const key = segments[segments.length - 1];
    if (!key) return item;
    const needle = JSON.stringify(key);
    const offset = text.indexOf(needle);
    if (offset < 0) return item;
    const before = text.slice(0, offset);
    const line = before.split('\n').length;
    const column = offset - before.lastIndexOf('\n');
    return {
      ...item,
      range: {
        start: { line, column },
        end: { line, column: column + needle.length },
      },
    };
  });
};

export const scenarioFromLoadedInput = (input: LoadedInput): Scenario => {
  if (input.kind === 'scenario') return input.value as Scenario;
  if (input.kind === 'graph')
    return compilePuzzleGraph(input.value as Parameters<typeof compilePuzzleGraph>[0]);
  const scenario = (input.value as ContentPack).scenario;
  if (!scenario) throw new Error('content pack does not declare a scenario');
  return scenario;
};

const authoredId = (input: LoadedInput): string =>
  isRecord(input.value) && typeof input.value.id === 'string'
    ? input.value.id
    : path.basename(input.file);

export const buildAuthoringSnapshot = async (
  input: LoadedInput,
  revision: number,
  reload: ReloadSnapshot
): Promise<AuthoringSnapshot> => {
  const scenario = scenarioFromLoadedInput(input);
  const lint = await lintValue(input.kind, input.value, { baseDir: input.baseDir });
  lint.diagnostics = await sourceDiagnostics(input, lint.diagnostics);

  let solve: AuthoringSnapshot['solve'];
  try {
    const report = await solveAuthoredValue(input.kind, input.value, { baseDir: input.baseDir });
    solve = { status: report.ok ? 'pass' : 'fail', result: report };
  } catch (error) {
    solve = {
      status: 'unavailable',
      error: error instanceof Error ? error.message : String(error),
    };
  }

  let pack: AuthoringSnapshot['pack'] = { status: 'unavailable' };
  if (input.kind === 'pack') {
    try {
      const result = await normalizeContentPack(input.value as ContentPack, input.baseDir);
      const diagnostics = await sourceDiagnostics(input, result.diagnostics);
      pack = {
        status: [...lint.diagnostics, ...diagnostics].some(item => item.level === 'error')
          ? 'fail'
          : 'pass',
        result: result.report,
      };
    } catch (error) {
      pack = { status: 'fail', error: error instanceof Error ? error.message : String(error) };
    }
  }

  const usage = collectFlagUsage(scenario);
  Object.keys(scenario.initialFlags ?? {}).forEach(flag => usage.set.add(flag));
  const tape = buildTape(scenario.rehearsal);
  const buddies = collectBuddies(input.value).map(item => {
    const reply = (item.value.reply ?? {}) as Record<string, unknown>;
    return {
      id: item.id,
      hasFallback:
        replyTexts(reply.fallback ?? (reply.kind === 'script' ? reply : undefined)).length > 0,
      hasProvider: reply.provider === 'chat' || reply.kind === 'provider',
    };
  });

  return {
    protocolVersion: AUTHORING_PROTOCOL_VERSION,
    revision,
    input: { file: input.file, kind: input.kind, id: authoredId(input) },
    reload,
    lint: { status: lint.ok ? 'pass' : 'fail', result: lint },
    solve,
    pack,
    graph: buildAuthoringGraph(input.kind, input.value),
    beats: tape.events.map((event, index) => ({
      index,
      ...(scenario.rehearsal?.walkthrough[index]?.beat
        ? { beat: scenario.rehearsal.walkthrough[index].beat }
        : {}),
      event,
    })),
    flags: [...new Set([...usage.read, ...usage.set])].sort(),
    buddies,
    recentEvents: [],
  };
};
