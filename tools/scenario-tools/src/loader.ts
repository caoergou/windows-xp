import { access, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createJiti } from 'jiti';
import type { ContentPack } from '../../../src/content/types';
import type { PuzzleGraph } from '../../../src/scenario/puzzleGraph';
import type { Scenario } from '../../../src/scenario/types';
import type { AuthoringKind, AuthoringValue, LoadedInput } from './types';

const MANIFEST_NAMES = ['content-pack.json', 'pack.json', 'content-pack.ts', 'pack.ts'];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const detectKind = (value: unknown): AuthoringKind => {
  if (!isRecord(value))
    throw new Error('input must export a scenario, puzzle graph, or content pack object');
  if (Array.isArray(value.puzzles)) return 'graph';
  if (
    typeof value.id === 'string' &&
    ['assets', 'sites', 'files', 'scenario'].some(key => key in value)
  ) {
    return 'pack';
  }
  if (Array.isArray(value.triggers)) return 'scenario';
  throw new Error('cannot identify input: expected `puzzles`, `triggers`, or content-pack fields');
};

const pickExport = (moduleValue: unknown): AuthoringValue => {
  const candidates: unknown[] = [];
  if (isRecord(moduleValue)) {
    if ('default' in moduleValue) candidates.push(moduleValue.default);
    candidates.push(...Object.values(moduleValue));
  } else {
    candidates.push(moduleValue);
  }
  for (const candidate of candidates) {
    try {
      detectKind(candidate);
      return candidate as AuthoringValue;
    } catch {
      // Keep looking through named exports.
    }
  }
  throw new Error('module does not export a scenario, puzzle graph, or content pack');
};

const findManifest = async (dir: string): Promise<string> => {
  for (const name of MANIFEST_NAMES) {
    const candidate = path.join(dir, name);
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Try the next conventional manifest name.
    }
  }
  throw new Error(`no content-pack manifest found in ${dir} (${MANIFEST_NAMES.join(', ')})`);
};

export const loadInput = async (inputPath: string): Promise<LoadedInput> => {
  let file = path.resolve(inputPath);
  const info = await stat(file).catch(() => null);
  if (!info) throw new Error(`input does not exist: ${file}`);
  if (info.isDirectory()) file = await findManifest(file);

  let value: AuthoringValue;
  if (path.extname(file).toLowerCase() === '.json') {
    const raw = JSON.parse(await readFile(file, 'utf8')) as unknown;
    detectKind(raw);
    value = raw as AuthoringValue;
  } else {
    const jiti = createJiti(pathToFileURL(file).href, {
      interopDefault: false,
      moduleCache: false,
    });
    value = pickExport(await jiti.import(file));
  }
  return { kind: detectKind(value), value, file, baseDir: path.dirname(file) };
};

export const asScenario = (input: LoadedInput): Scenario => {
  if (input.kind === 'scenario') return input.value as Scenario;
  if (input.kind === 'pack') {
    const scenario = (input.value as ContentPack).scenario;
    if (!scenario) throw new Error('content pack does not declare a scenario');
    return scenario;
  }
  throw new Error('puzzle graph must be compiled before it can be used as a scenario');
};

export const asGraph = (input: LoadedInput): PuzzleGraph | undefined =>
  input.kind === 'graph' ? (input.value as PuzzleGraph) : undefined;
