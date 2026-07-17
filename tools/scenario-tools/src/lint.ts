import { access } from 'node:fs/promises';
import path from 'node:path';
import { buildSiteRegistry, normalizeSiteUrl } from '../../../src/content/pack';
import type { ContentPack, ContentRef } from '../../../src/content/types';
import {
  compilePuzzleGraph,
  lintPuzzleGraph,
  type PuzzleGraph,
} from '../../../src/scenario/puzzleGraph';
import type { Action, Condition, Scenario } from '../../../src/scenario/types';
import { validateScenario } from '../../../src/scenario/validate';
import { KNOWN_EVENT_TYPES } from './eventTypes';
import { validateContentPackSchema, validateScenarioSchema } from './schema';
import type { AuthoringKind, AuthoringValue, Diagnostic, LintResult } from './types';
import { diagnostic, hasErrors } from './types';
import { collectFlagUsage, contentRefAt, walkValue } from './walk';

export interface LintOptions {
  baseDir?: string;
  sites?: ContentPack['sites'];
  files?: ContentPack['files'];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const conditionEvents = (condition: Condition | undefined, out: string[] = []): string[] => {
  if (!condition) return out;
  if ('all' in condition) condition.all.forEach(item => conditionEvents(item, out));
  else if ('any' in condition) condition.any.forEach(item => conditionEvents(item, out));
  else if ('not' in condition) conditionEvents(condition.not, out);
  else if ('happened' in condition) out.push(condition.happened.type);
  else if ('count' in condition) out.push(condition.count.type);
  return out;
};

const actionEvents = (actions: Action[], out: string[] = []): string[] => {
  actions.forEach(action => {
    if ('emit' in action) out.push(action.emit.type);
    else if ('after' in action) actionEvents(action.after.do, out);
  });
  return out;
};

const knownPackPaths = (files: ContentPack['files']): Set<string> => {
  const out = new Set<string>();
  const visit = (nodes: Record<string, unknown>, prefix: string[]): void => {
    Object.entries(nodes).forEach(([key, node]) => {
      const current = [...prefix, key];
      out.add(current.join('/'));
      if (isRecord(node) && isRecord(node.children)) visit(node.children, current);
    });
  };
  visit((files ?? {}) as Record<string, unknown>, []);
  return out;
};

const lintProviderContexts = (
  scenario: Scenario,
  files: ContentPack['files'],
  diagnostics: Diagnostic[]
): void => {
  const flags = collectFlagUsage(scenario);
  Object.keys(scenario.initialFlags ?? {}).forEach(flag => flags.set.add(flag));
  const filePaths = knownPackPaths(files);

  walkValue(scenario, ({ value, path: valuePath }) => {
    if (!isRecord(value) || value.provider !== 'chat') return;
    if (!Array.isArray(value.fallback) || value.fallback.length === 0) {
      diagnostics.push(
        diagnostic(
          'error',
          'provider-fallback',
          'provider chat branch must declare a non-empty fallback',
          valuePath
        )
      );
    }
    const context = value.context;
    if (!Array.isArray(context)) return;
    context.forEach((selector, index) => {
      if (!isRecord(selector)) return;
      const selectorPath = `${valuePath}.context[${index}]`;
      const selectedFlags = Array.isArray(selector.flags)
        ? selector.flags
        : typeof selector.flag === 'string'
          ? [selector.flag]
          : [];
      selectedFlags.forEach(flag => {
        if (typeof flag === 'string' && !flags.set.has(flag)) {
          diagnostics.push(
            diagnostic(
              'error',
              'provider-flag',
              `provider context references unknown flag "${flag}"`,
              selectorPath
            )
          );
        }
      });
      const summary = selector.fileSummary;
      const summaryPath = Array.isArray(summary)
        ? summary
        : isRecord(summary) && Array.isArray(summary.path)
          ? summary.path
          : undefined;
      if (summaryPath?.every(segment => typeof segment === 'string')) {
        const joined = summaryPath.join('/');
        if (!filePaths.has(joined)) {
          diagnostics.push(
            diagnostic(
              'error',
              'provider-file',
              `provider context references missing file "${joined}"`,
              selectorPath
            )
          );
        }
      }
    });
  });
};

const lintAuthorizedUrls = (
  scenario: Scenario,
  sites: ContentPack['sites'],
  diagnostics: Diagnostic[]
): void => {
  const authorized = new Set(Object.keys(buildSiteRegistry(sites)));
  walkValue(scenario, ({ value, path: valuePath }) => {
    if (typeof value !== 'string' || !/^https?:\/\//i.test(value)) return;
    if (!authorized.has(normalizeSiteUrl(value))) {
      diagnostics.push(
        diagnostic(
          'error',
          'unauthorized-url',
          `URL is not registered in content pack sites: ${value}`,
          valuePath
        )
      );
    }
  });
};

export const lintScenario = (scenario: Scenario, options: LintOptions = {}): LintResult => {
  const diagnostics: Diagnostic[] = validateScenarioSchema(scenario);
  const runtime = validateScenario(scenario);
  runtime.errors.forEach(message =>
    diagnostics.push(diagnostic('error', 'scenario-schema', message))
  );
  runtime.warnings.forEach(message =>
    diagnostics.push(diagnostic('warning', 'scenario-schema', message))
  );

  const ids = new Set<string>();
  scenario.triggers.forEach((trigger, index) => {
    if (trigger.id) {
      if (ids.has(trigger.id)) {
        diagnostics.push(
          diagnostic(
            'error',
            'duplicate-trigger-id',
            `duplicate trigger id "${trigger.id}"`,
            `triggers[${index}].id`
          )
        );
      }
      ids.add(trigger.id);
    }
    const eventTypes = [
      ...(Array.isArray(trigger.on) ? trigger.on : [trigger.on]),
      ...conditionEvents(trigger.when),
      ...actionEvents(trigger.do),
    ];
    eventTypes.forEach(eventType => {
      if (!KNOWN_EVENT_TYPES.has(eventType)) {
        diagnostics.push(
          diagnostic(
            'error',
            'unknown-event',
            `unknown event type "${eventType}"`,
            `triggers[${index}]`
          )
        );
      }
    });
  });

  const flags = collectFlagUsage(scenario);
  flags.set.forEach(flag => {
    if (!flags.read.has(flag)) {
      diagnostics.push(
        diagnostic('warning', 'dead-flag', `flag "${flag}" is set but never read by a condition`)
      );
    }
  });
  if (options.sites) lintAuthorizedUrls(scenario, options.sites, diagnostics);
  lintProviderContexts(scenario, options.files, diagnostics);
  return { ok: !hasErrors(diagnostics), diagnostics };
};

export const lintGraph = (graph: PuzzleGraph): LintResult => {
  const diagnostics: Diagnostic[] = [];
  const ids = new Set<string>();
  graph.puzzles.forEach((puzzle, index) => {
    if (ids.has(puzzle.id)) {
      diagnostics.push(
        diagnostic(
          'error',
          'duplicate-puzzle-id',
          `duplicate puzzle id "${puzzle.id}"`,
          `puzzles[${index}].id`
        )
      );
    }
    ids.add(puzzle.id);
  });
  lintPuzzleGraph(graph).issues.forEach(issue => {
    diagnostics.push(
      diagnostic(
        issue.level === 'warn' ? 'warning' : issue.level,
        'puzzle-graph',
        issue.message,
        issue.puzzle ? `puzzles.${issue.puzzle}` : undefined
      )
    );
  });
  diagnostics.push(...lintScenario(compilePuzzleGraph(graph)).diagnostics);
  return { ok: !hasErrors(diagnostics), diagnostics };
};

const localPathFor = (url: string, baseDir: string | undefined): string | undefined => {
  if (!baseDir || /^(?:[a-z]+:)?\/\//i.test(url) || url.startsWith('data:')) return undefined;
  return path.resolve(baseDir, url);
};

const validateRef = async (
  ref: ContentRef,
  refPath: string,
  pack: ContentPack,
  options: LintOptions,
  usedAssets: Set<string>,
  diagnostics: Diagnostic[]
): Promise<void> => {
  if (typeof ref === 'string') return;
  if (typeof ref !== 'string' && 'asset' in ref) {
    usedAssets.add(ref.asset);
    if (!(ref.asset in (pack.assets ?? {}))) {
      diagnostics.push(
        diagnostic('error', 'broken-asset', `unknown asset key "${ref.asset}"`, refPath)
      );
    }
    return;
  }
  if (ref.url.trim() === '') {
    diagnostics.push(diagnostic('error', 'invalid-url', 'content URL must not be empty', refPath));
    return;
  }
  const local = localPathFor(ref.url, options.baseDir);
  if (local) {
    try {
      await access(local);
    } catch {
      diagnostics.push(
        diagnostic('error', 'missing-file', `content file does not exist: ${ref.url}`, refPath)
      );
    }
  } else {
    try {
      new URL(ref.url);
    } catch {
      diagnostics.push(
        diagnostic('error', 'invalid-url', `cannot parse content URL "${ref.url}"`, refPath)
      );
    }
  }
};

export const lintContentPack = async (
  pack: ContentPack,
  options: LintOptions = {}
): Promise<LintResult> => {
  const diagnostics: Diagnostic[] = validateContentPackSchema(pack);
  if (!isRecord(pack) || typeof pack.id !== 'string' || pack.id.trim() === '') {
    diagnostics.push(
      diagnostic('error', 'pack-schema', 'content pack id must be a non-empty string', '$.id')
    );
  }
  if (pack.assets !== undefined && !isRecord(pack.assets)) {
    diagnostics.push(diagnostic('error', 'pack-schema', 'assets must be an object', '$.assets'));
  }
  if (pack.sites !== undefined && !isRecord(pack.sites)) {
    diagnostics.push(diagnostic('error', 'pack-schema', 'sites must be an object', '$.sites'));
  }
  if (pack.files !== undefined && !isRecord(pack.files)) {
    diagnostics.push(diagnostic('error', 'pack-schema', 'files must be an object', '$.files'));
  }

  buildSiteRegistry(pack.sites, (normalized, first, second) => {
    diagnostics.push(
      diagnostic(
        'error',
        'site-conflict',
        `site keys "${first}" and "${second}" both normalize to "${normalized}"`,
        '$.sites'
      )
    );
  });

  walkValue(pack.files, ({ value, path: valuePath }) => {
    if (isRecord(value) && 'content' in value && 'contentRef' in value) {
      diagnostics.push(
        diagnostic(
          'error',
          'content-exclusive',
          'file node cannot declare both content and contentRef',
          valuePath
        )
      );
    }
    if (isRecord(value) && typeof value.type === 'string') {
      const timestampFields = ['ctime', 'mtime', 'atime', 'importedAt'] as const;
      for (const field of timestampFields) {
        if (value[field] !== undefined && !Number.isFinite(Date.parse(String(value[field])))) {
          diagnostics.push(
            diagnostic(
              'error',
              'invalid-iso-time',
              `${field} must be a valid ISO time`,
              `${valuePath}.${field}`
            )
          );
        }
      }
      if (
        typeof value.ctime === 'string' &&
        typeof value.mtime === 'string' &&
        Date.parse(value.ctime) > Date.parse(value.mtime)
      ) {
        diagnostics.push(
          diagnostic(
            'warning',
            'suspicious-file-time',
            'ctime is later than mtime; preserved as authored forensic evidence',
            valuePath
          )
        );
      }
    }
  });

  Object.entries(pack.recycleBin ?? {}).forEach(([key, record]) => {
    if (!Number.isFinite(Date.parse(String(record.deletedAt)))) {
      diagnostics.push(
        diagnostic(
          'error',
          'invalid-iso-time',
          'deletedAt must be a valid ISO time',
          `$.recycleBin.${key}.deletedAt`
        )
      );
    }
  });
  (pack.recentDocuments ?? []).forEach((entry, index) => {
    if (!Number.isFinite(Date.parse(entry.openedAt))) {
      diagnostics.push(
        diagnostic(
          'error',
          'invalid-iso-time',
          'openedAt must be a valid ISO time',
          `$.recentDocuments[${index}].openedAt`
        )
      );
    }
  });
  const printerIds = new Set<string>();
  (pack.printers ?? []).forEach((printer, index) => {
    if (printerIds.has(printer.id)) {
      diagnostics.push(
        diagnostic(
          'error',
          'duplicate-printer',
          `duplicate printer id "${printer.id}"`,
          `$.printers[${index}]`
        )
      );
    }
    printerIds.add(printer.id);
  });
  const printJobIds = new Set<string>();
  (pack.printJobs ?? []).forEach((job, index) => {
    const path = `$.printJobs[${index}]`;
    if (printJobIds.has(job.id)) {
      diagnostics.push(
        diagnostic('error', 'duplicate-print-job', `duplicate print job id "${job.id}"`, path)
      );
    }
    printJobIds.add(job.id);
    if (!printerIds.has(job.printerId)) {
      diagnostics.push(
        diagnostic(
          'error',
          'unknown-printer',
          `unknown printer "${job.printerId}"`,
          `${path}.printerId`
        )
      );
    }
    if (!job.documentName.trim()) {
      diagnostics.push(
        diagnostic('error', 'print-job-name', 'documentName is required', `${path}.documentName`)
      );
    }
    if (!Number.isFinite(Date.parse(job.submittedAt))) {
      diagnostics.push(
        diagnostic(
          'error',
          'invalid-iso-time',
          'submittedAt must be a valid ISO time',
          `${path}.submittedAt`
        )
      );
    }
  });

  const usedAssets = new Set<string>();
  const pending: Promise<void>[] = [];
  walkValue(pack, ({ value, path: valuePath }) => {
    const ref = contentRefAt(value);
    if (!ref) return;
    if (valuePath.startsWith('$.assets.')) {
      if ('asset' in ref) {
        diagnostics.push(
          diagnostic(
            'error',
            'asset-indirection',
            'asset manifest values cannot reference another asset',
            valuePath
          )
        );
      } else {
        pending.push(validateRef(ref, valuePath, pack, options, usedAssets, diagnostics));
      }
      return;
    }
    pending.push(validateRef(ref, valuePath, pack, options, usedAssets, diagnostics));
  });
  await Promise.all(pending);

  Object.keys(pack.assets ?? {}).forEach(key => {
    if (!usedAssets.has(key)) {
      diagnostics.push(
        diagnostic(
          'error',
          'orphan-asset',
          `asset "${key}" is declared but never referenced`,
          `$.assets.${key}`
        )
      );
    }
  });

  if (pack.scenario) {
    diagnostics.push(
      ...lintScenario(pack.scenario, { ...options, sites: pack.sites, files: pack.files })
        .diagnostics
    );
  }
  return { ok: !hasErrors(diagnostics), diagnostics };
};

export const lintValue = async (
  kind: AuthoringKind,
  value: AuthoringValue,
  options: LintOptions = {}
): Promise<LintResult> => {
  if (kind === 'scenario') return lintScenario(value as Scenario, options);
  if (kind === 'graph') return lintGraph(value as PuzzleGraph);
  return lintContentPack(value as ContentPack, options);
};
