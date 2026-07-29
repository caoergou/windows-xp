import { access } from 'node:fs/promises';
import path from 'node:path';
import { buildSiteRegistry, normalizeSiteUrl } from '../../../src/content/pack';
import type { ContentPack, ContentRef, NarrativeRef } from '../../../src/content/types';
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

const VISIBLE_ACTION_KEYS = new Set([
  'notify',
  'note',
  'qqMessage',
  'qqOnline',
  'openApp',
  'openFile',
  'playSound',
  'alert',
  'addFile',
  'removeFile',
  'writeFile',
  'unlock',
]);

const hasVisibleAction = (actions: Action[]): boolean =>
  actions.some(action => {
    if ('after' in action) return hasVisibleAction(action.after.do);
    return Object.keys(action).some(key => VISIBLE_ACTION_KEYS.has(key));
  });

const isPlayerActionEvent = (eventType: string): boolean =>
  !eventType.startsWith('time:') &&
  eventType !== 'flag:change' &&
  eventType !== 'session:boot-complete' &&
  eventType !== 'user:idle' &&
  eventType !== 'notification:show' &&
  eventType !== 'qq:online';

const conditionHasPlayerEvent = (condition: Condition | undefined): boolean => {
  if (!condition) return false;
  if ('all' in condition) return condition.all.some(conditionHasPlayerEvent);
  if ('any' in condition) return condition.any.some(conditionHasPlayerEvent);
  if ('not' in condition) return conditionHasPlayerEvent(condition.not);
  if ('happened' in condition) return isPlayerActionEvent(condition.happened.type);
  if ('count' in condition) return isPlayerActionEvent(condition.count.type);
  return false;
};

const actionCreatesClue = (actions: Action[]): boolean =>
  actions.some(action => {
    if ('after' in action) return actionCreatesClue(action.after.do);
    return 'unlock' in action || 'addFile' in action || 'writeFile' in action;
  });

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

const sameNarrativeRef = (left: NarrativeRef, right: NarrativeRef): boolean => {
  if (left.kind !== right.kind) return false;
  if (left.kind === 'asset' && right.kind === 'asset') return left.key === right.key;
  if (left.kind === 'file' && right.kind === 'file')
    return left.path.join('/') === right.path.join('/');
  if (left.kind === 'site' && right.kind === 'site')
    return normalizeSiteUrl(left.url) === normalizeSiteUrl(right.url);
  return left.kind === 'contact' && right.kind === 'contact' && left.id === right.id;
};

const isNarrativeRef = (value: unknown): value is NarrativeRef => {
  if (!isRecord(value)) return false;
  if (value.kind === 'asset') return typeof value.key === 'string';
  if (value.kind === 'file')
    return Array.isArray(value.path) && value.path.every(segment => typeof segment === 'string');
  if (value.kind === 'site') return typeof value.url === 'string';
  return value.kind === 'contact' && typeof value.id === 'string';
};

const valueContainsPath = (value: unknown, expected: string[]): boolean => {
  let found = false;
  walkValue(value, ({ value: candidate }) => {
    if (
      Array.isArray(candidate) &&
      candidate.length === expected.length &&
      candidate.every((segment, index) => segment === expected[index])
    ) {
      found = true;
    }
  });
  return found;
};

const valueContainsString = (value: unknown, expected: string): boolean => {
  let found = false;
  walkValue(value, ({ value: candidate }) => {
    if (candidate === expected) found = true;
  });
  return found;
};

const narrativeRefExists = (
  ref: NarrativeRef,
  pack: ContentPack,
  filePaths: Set<string>,
  sites: Set<string>
): boolean => {
  if (ref.kind === 'asset') return Object.prototype.hasOwnProperty.call(pack.assets ?? {}, ref.key);
  if (ref.kind === 'file') return filePaths.has(ref.path.join('/'));
  if (ref.kind === 'site') return sites.has(normalizeSiteUrl(ref.url));
  // Contact definitions currently live in scenario/QQ archive data rather than
  // a single registry, so explicit occurrence is the truthful existence test.
  return valueContainsString(pack.scenario, ref.id) || valueContainsString(pack.qqArchives, ref.id);
};

const assetCarrierRefs = (pack: ContentPack, asset: string): NarrativeRef[] => {
  const refs: NarrativeRef[] = [];
  const visitFiles = (nodes: Record<string, unknown>, prefix: string[]): void => {
    Object.entries(nodes).forEach(([key, node]) => {
      const path = [...prefix, key];
      if (isRecord(node)) {
        if (isRecord(node.contentRef) && node.contentRef.asset === asset) {
          refs.push({ kind: 'file', path });
        }
        if (isRecord(node.children)) visitFiles(node.children, path);
      }
    });
  };
  visitFiles((pack.files ?? {}) as Record<string, unknown>, []);
  Object.entries(pack.sites ?? {}).forEach(([url, site]) => {
    let usesAsset = false;
    walkValue(site, ({ value }) => {
      if (isRecord(value) && value.asset === asset) usesAsset = true;
    });
    if (usesAsset) refs.push({ kind: 'site', url });
  });
  return refs;
};

const narrativeRefRecovered = (ref: NarrativeRef, pack: ContentPack): boolean => {
  const scenario = pack.scenario;
  if (!scenario) return false;
  if (ref.kind === 'file') return valueContainsPath(scenario, ref.path);
  if (ref.kind === 'site') {
    const normalized = normalizeSiteUrl(ref.url);
    let found = false;
    walkValue(scenario, ({ value }) => {
      if (typeof value === 'string' && /^https?:\/\//i.test(value)) {
        if (normalizeSiteUrl(value) === normalized) found = true;
      }
    });
    return found;
  }
  if (ref.kind === 'contact') return valueContainsString(scenario, ref.id);
  if (valueContainsString(scenario, ref.key)) return true;
  return assetCarrierRefs(pack, ref.key).some(carrier => narrativeRefRecovered(carrier, pack));
};

const lintNarrativeMetadata = (pack: ContentPack, diagnostics: Diagnostic[]): void => {
  const metadata = pack.narrative;
  if (!isRecord(metadata)) return;
  const filePaths = knownPackPaths(pack.files);
  const sites = new Set(Object.keys(buildSiteRegistry(pack.sites)));
  const prominent = Array.isArray(metadata.prominent) ? metadata.prominent : [];
  const redHerrings = Array.isArray(metadata.redHerrings) ? metadata.redHerrings : [];
  const ids = new Set<string>();

  prominent.forEach((item, index) => {
    if (!isRecord(item) || typeof item.id !== 'string' || !isNarrativeRef(item.ref)) return;
    const itemId = item.id;
    const itemRef = item.ref;
    const itemPath = `$.narrative.prominent[${index}]`;
    if (ids.has(itemId)) {
      diagnostics.push(
        diagnostic(
          'warning',
          'duplicate-narrative-id',
          `duplicate narrative id "${itemId}"`,
          itemPath
        )
      );
    }
    ids.add(itemId);
    if (!narrativeRefExists(itemRef, pack, filePaths, sites)) {
      diagnostics.push(
        diagnostic(
          'warning',
          'narrative-ref-missing',
          `prominent item "${itemId}" points to a missing ${itemRef.kind}`,
          `${itemPath}.ref`
        )
      );
      return;
    }
    const registeredAsRedHerring = redHerrings.some(
      red => isRecord(red) && isNarrativeRef(red.ref) && sameNarrativeRef(red.ref, itemRef)
    );
    if (!registeredAsRedHerring && !narrativeRefRecovered(itemRef, pack)) {
      diagnostics.push(
        diagnostic(
          'warning',
          'chekhov-unresolved',
          `prominent item "${itemId}" is never recovered by a trigger, puzzle, or debrief`,
          itemPath
        )
      );
    }
  });

  redHerrings.forEach((red, index) => {
    if (!isRecord(red) || typeof red.id !== 'string' || !isNarrativeRef(red.ref)) return;
    const redId = red.id;
    const redRef = red.ref;
    const redPath = `$.narrative.redHerrings[${index}]`;
    if (ids.has(redId)) {
      diagnostics.push(
        diagnostic(
          'warning',
          'duplicate-narrative-id',
          `duplicate narrative id "${redId}"`,
          redPath
        )
      );
    }
    ids.add(redId);
    const missingFields = [
      typeof red.misdirection !== 'string' || !red.misdirection.trim() ? 'misdirection' : undefined,
      typeof red.explanation !== 'string' || !red.explanation.trim() ? 'explanation' : undefined,
      !isNarrativeRef(red.payoff) ? 'payoff' : undefined,
    ].filter((field): field is string => field !== undefined);
    if (missingFields.length > 0) {
      diagnostics.push(
        diagnostic(
          'warning',
          'red-herring-incomplete',
          `red herring "${redId}" is missing ${missingFields.join(', ')}`,
          redPath
        )
      );
    }
    if (!narrativeRefExists(redRef, pack, filePaths, sites)) {
      diagnostics.push(
        diagnostic(
          'warning',
          'red-herring-ref-missing',
          `red herring "${redId}" points to a missing ${redRef.kind}`,
          `${redPath}.ref`
        )
      );
    }
    if (isNarrativeRef(red.payoff) && !narrativeRefExists(red.payoff, pack, filePaths, sites)) {
      diagnostics.push(
        diagnostic(
          'warning',
          'red-herring-payoff-missing',
          `red herring "${redId}" payoff points to a missing ${red.payoff.kind}`,
          `${redPath}.payoff`
        )
      );
    }
  });
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
  const usesClueLayers = graph.puzzles.some(puzzle => puzzle.tier !== undefined);
  const byId = new Map(graph.puzzles.map(puzzle => [puzzle.id, puzzle]));
  const playerDriven = (puzzleId: string, seen = new Set<string>()): boolean => {
    if (seen.has(puzzleId)) return false;
    seen.add(puzzleId);
    const puzzle = byId.get(puzzleId);
    if (!puzzle) return false;
    const eventTypes = Array.isArray(puzzle.on)
      ? puzzle.on
      : puzzle.on
        ? [puzzle.on]
        : conditionEvents(puzzle.solvedWhen);
    return (
      eventTypes.some(isPlayerActionEvent) ||
      conditionHasPlayerEvent(puzzle.solvedWhen) ||
      (puzzle.requires ?? []).some(requiredId => playerDriven(requiredId, new Set(seen)))
    );
  };
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
    if (usesClueLayers && puzzle.tier === undefined) {
      diagnostics.push(
        diagnostic(
          'warning',
          'clue-tier-missing',
          `puzzle "${puzzle.id}" must be marked required or optional once clue layers are enabled`,
          `puzzles[${index}].tier`
        )
      );
    }
    if (puzzle.tier === 'required') {
      (puzzle.requires ?? []).forEach(requiredId => {
        const dependency = graph.puzzles.find(candidate => candidate.id === requiredId);
        if (dependency?.tier === 'optional') {
          diagnostics.push(
            diagnostic(
              'warning',
              'required-depends-on-optional',
              `required puzzle "${puzzle.id}" depends on optional puzzle "${requiredId}"`,
              `puzzles[${index}].requires`
            )
          );
        }
      });
      if (!hasVisibleAction(puzzle.grants ?? [])) {
        diagnostics.push(
          diagnostic(
            'warning',
            'progress-feedback',
            `required puzzle "${puzzle.id}" sets progress without a player-visible grant`,
            `puzzles[${index}].grants`
          )
        );
      }
      const eventTypes = Array.isArray(puzzle.on)
        ? puzzle.on
        : puzzle.on
          ? [puzzle.on]
          : conditionEvents(puzzle.solvedWhen);
      const pureTimer =
        eventTypes.length > 0 &&
        eventTypes.every(eventType => eventType.startsWith('time:')) &&
        !conditionHasPlayerEvent(puzzle.solvedWhen) &&
        !(puzzle.requires ?? []).some(requiredId => playerDriven(requiredId));
      if (pureTimer && actionCreatesClue(puzzle.grants ?? [])) {
        diagnostics.push(
          diagnostic(
            'warning',
            'coincidence-unlocks-required-clue',
            `required puzzle "${puzzle.id}" reveals a clue from a pure timer without a player-action condition`,
            `puzzles[${index}]`
          )
        );
      }
    }
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
  const playlistIds = new Set<string>();
  (pack.playlists ?? []).forEach((playlist, playlistIndex) => {
    if (playlistIds.has(playlist.id)) {
      diagnostics.push(
        diagnostic(
          'error',
          'duplicate-playlist',
          `duplicate playlist id "${playlist.id}"`,
          `$.playlists[${playlistIndex}]`
        )
      );
    }
    playlistIds.add(playlist.id);
    const trackIds = new Set<string>();
    playlist.tracks.forEach((track, trackIndex) => {
      const path = `$.playlists[${playlistIndex}].tracks[${trackIndex}]`;
      if (trackIds.has(track.id)) {
        diagnostics.push(
          diagnostic('error', 'duplicate-track', `duplicate track id "${track.id}"`, path)
        );
      }
      trackIds.add(track.id);
      const ref = track.src;
      const candidate = typeof ref === 'string' ? ref : 'url' in ref ? ref.url : '';
      if (candidate && !/\.(mp3|wav|wma|ogg|m4a)(?:[?#]|$)/i.test(candidate)) {
        diagnostics.push(
          diagnostic(
            'warning',
            'media-extension',
            'track source has no recognized audio extension',
            `${path}.src`
          )
        );
      }
    });
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
  lintNarrativeMetadata(pack, diagnostics);
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
