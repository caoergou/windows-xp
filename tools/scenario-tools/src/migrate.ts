import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { FlagValue, Scenario } from '../../../src/scenario/types';
import type { Diagnostic } from './types';
import { diagnostic, hasErrors } from './types';
import { collectFlagUsage } from './walk';

export interface ScenarioSave {
  scenarioId?: string;
  flags: Record<string, unknown>;
  fires?: Record<string, number>;
  journal?: unknown[];
  pending?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface MigrationMap {
  flags?: Record<string, string>;
  triggers?: Record<string, string>;
}

export interface MigrateOptions extends MigrationMap {
  dropOrphans?: boolean;
}

export interface MigrationResult {
  ok: boolean;
  changed: boolean;
  diagnostics: Diagnostic[];
  save: ScenarioSave;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const parseScenarioSave = (value: unknown): ScenarioSave => {
  if (!isRecord(value)) throw new Error('save must be a JSON object');
  if (!isRecord(value.flags)) throw new Error('save must contain a `flags` object');
  if (value.fires !== undefined && !isRecord(value.fires)) {
    throw new Error('save `fires` must be an object when present');
  }
  return value as ScenarioSave;
};

const renameKeys = <T>(
  source: Record<string, T>,
  mapping: Record<string, string>,
  kind: string,
  diagnostics: Diagnostic[]
): { value: Record<string, T>; changed: boolean } => {
  const value = { ...source };
  let changed = false;
  Object.entries(mapping).forEach(([from, to]) => {
    if (!(from in value)) {
      diagnostics.push(
        diagnostic(
          'warning',
          'migration-map-missing',
          `${kind} mapping source "${from}" is not in the save`
        )
      );
      return;
    }
    if (to in value && to !== from) {
      diagnostics.push(
        diagnostic(
          'error',
          'migration-map-collision',
          `${kind} mapping "${from}" -> "${to}" would overwrite existing progress`
        )
      );
      return;
    }
    value[to] = value[from];
    if (to !== from) delete value[from];
    changed ||= to !== from;
  });
  return { value, changed };
};

export const migrateScenarioSave = (
  scenario: Scenario,
  original: ScenarioSave,
  options: MigrateOptions = {}
): MigrationResult => {
  const diagnostics: Diagnostic[] = [];
  const save: ScenarioSave = JSON.parse(JSON.stringify(original)) as ScenarioSave;
  let changed = false;
  if (save.scenarioId && save.scenarioId !== scenario.id) {
    diagnostics.push(
      diagnostic(
        'warning',
        'scenario-id-changed',
        `save belongs to scenario "${save.scenarioId}", target is "${scenario.id}"`
      )
    );
  }

  const flagRename = renameKeys(save.flags, options.flags ?? {}, 'flag', diagnostics);
  save.flags = flagRename.value;
  changed ||= flagRename.changed;
  if (save.fires) {
    const triggerRename = renameKeys(save.fires, options.triggers ?? {}, 'trigger', diagnostics);
    save.fires = triggerRename.value;
    changed ||= triggerRename.changed;
  }

  const usage = collectFlagUsage(scenario);
  Object.keys(scenario.initialFlags ?? {}).forEach(flag => usage.set.add(flag));
  usage.read.forEach(flag => usage.set.add(flag));
  const orphanFlags = Object.keys(save.flags).filter(flag => !usage.set.has(flag));
  orphanFlags.forEach(flag => {
    diagnostics.push(
      diagnostic(
        'warning',
        'orphan-flag',
        `saved flag "${flag}" is not referenced by the target scenario`,
        `flags.${flag}`
      )
    );
    if (options.dropOrphans) {
      delete save.flags[flag];
      changed = true;
    }
  });

  const validFires = new Set(
    scenario.triggers.map((trigger, index) => trigger.id ?? String(index))
  );
  Object.keys(save.fires ?? {}).forEach(trigger => {
    if (validFires.has(trigger)) return;
    diagnostics.push(
      diagnostic(
        'warning',
        'orphan-fire',
        `once/max bookkeeping key "${trigger}" has no trigger in the target scenario`,
        `fires.${trigger}`
      )
    );
    if (options.dropOrphans && save.fires) {
      delete save.fires[trigger];
      changed = true;
    }
  });

  scenario.triggers.forEach((trigger, index) => {
    if ((trigger.once || trigger.max !== undefined) && !trigger.id) {
      diagnostics.push(
        diagnostic(
          'warning',
          'unstable-trigger-id',
          `once/max trigger at index ${index} has no stable id; reordering it can silently corrupt saved fire counts`,
          `triggers[${index}]`
        )
      );
    }
  });
  if (!save.fires) {
    diagnostics.push(
      diagnostic(
        'info',
        'missing-fire-state',
        'save has no `fires` map; trigger-id and once bookkeeping compatibility cannot be assessed'
      )
    );
  }
  save.scenarioId = scenario.id;
  changed ||= original.scenarioId !== scenario.id;
  return { ok: !hasErrors(diagnostics), changed, diagnostics, save };
};

export const migrateSaveFile = async (
  scenario: Scenario,
  saveFile: string,
  options: MigrateOptions & { write?: boolean; output?: string } = {}
): Promise<MigrationResult & { output?: string }> => {
  const absolute = path.resolve(saveFile);
  const original = parseScenarioSave(JSON.parse(await readFile(absolute, 'utf8')) as unknown);
  const result = migrateScenarioSave(scenario, original, options);
  let output: string | undefined;
  if (options.write && result.ok) {
    output = path.resolve(options.output ?? absolute);
    await writeFile(output, `${JSON.stringify(result.save, null, 2)}\n`, 'utf8');
  }
  return { ...result, ...(output ? { output } : {}) };
};

export const parseFlagValue = (raw: string): FlagValue => {
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  const number = Number(raw);
  return raw.trim() !== '' && Number.isFinite(number) ? number : raw;
};
