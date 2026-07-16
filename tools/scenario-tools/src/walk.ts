import type { ContentRef } from '../../../src/content/types';
import type { Action, Condition, Scenario } from '../../../src/scenario/types';

export interface ValueVisit {
  value: unknown;
  path: string;
  parent?: Record<string, unknown>;
}

export const walkValue = (
  value: unknown,
  visitor: (visit: ValueVisit) => void,
  currentPath = '$',
  parent?: Record<string, unknown>
): void => {
  visitor({ value, path: currentPath, ...(parent ? { parent } : {}) });
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkValue(item, visitor, `${currentPath}[${index}]`));
  } else if (typeof value === 'object' && value !== null) {
    const record = value as Record<string, unknown>;
    Object.entries(record).forEach(([key, item]) =>
      walkValue(item, visitor, `${currentPath}.${key}`, record)
    );
  }
};

export const contentRefAt = (value: unknown): Exclude<ContentRef, string> | undefined => {
  if (typeof value === 'string') return undefined;
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const keys = Object.keys(value);
  if (keys.length !== 1) return undefined;
  const record = value as Record<string, unknown>;
  if (typeof record.asset === 'string') return { asset: record.asset };
  if (typeof record.url === 'string') return { url: record.url };
  return undefined;
};

export const collectFlagUsage = (scenario: Scenario): { read: Set<string>; set: Set<string> } => {
  const read = new Set<string>();
  const set = new Set<string>();

  const visitCondition = (condition: Condition): void => {
    if ('flag' in condition) read.add(condition.flag);
    else if ('all' in condition) condition.all.forEach(visitCondition);
    else if ('any' in condition) condition.any.forEach(visitCondition);
    else if ('not' in condition) visitCondition(condition.not);
  };
  const visitActions = (actions: Action[]): void => {
    actions.forEach(action => {
      if ('setFlag' in action) set.add(action.setFlag);
      else if ('incFlag' in action) set.add(action.incFlag);
      else if ('after' in action) visitActions(action.after.do);
    });
  };

  scenario.triggers.forEach(trigger => {
    if (trigger.when) visitCondition(trigger.when);
    visitActions(trigger.do);
  });
  return { read, set };
};

export const collectConditionFlags = (
  condition: Condition | undefined,
  out = new Set<string>()
): Set<string> => {
  if (!condition) return out;
  if ('flag' in condition) out.add(condition.flag);
  else if ('all' in condition) condition.all.forEach(item => collectConditionFlags(item, out));
  else if ('any' in condition) condition.any.forEach(item => collectConditionFlags(item, out));
  else if ('not' in condition) collectConditionFlags(condition.not, out);
  return out;
};

export const collectActionFlags = (actions: Action[], out = new Set<string>()): Set<string> => {
  actions.forEach(action => {
    if ('setFlag' in action) out.add(action.setFlag);
    else if ('incFlag' in action) out.add(action.incFlag);
    else if ('after' in action) collectActionFlags(action.after.do, out);
  });
  return out;
};
