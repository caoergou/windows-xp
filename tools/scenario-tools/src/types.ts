import type { ContentPack } from '../../../src/content/types';
import type { PuzzleGraph } from '../../../src/scenario/puzzleGraph';
import type { Scenario } from '../../../src/scenario/types';

export type AuthoringValue = Scenario | PuzzleGraph | ContentPack;
export type AuthoringKind = 'scenario' | 'graph' | 'pack';
export type DiagnosticLevel = 'error' | 'warning' | 'info';

export interface Diagnostic {
  level: DiagnosticLevel;
  code: string;
  message: string;
  path?: string;
}

export interface LoadedInput {
  kind: AuthoringKind;
  value: AuthoringValue;
  file: string;
  baseDir: string;
}

export interface LintResult {
  ok: boolean;
  diagnostics: Diagnostic[];
}

export const diagnostic = (
  level: DiagnosticLevel,
  code: string,
  message: string,
  path?: string
): Diagnostic => ({ level, code, message, ...(path ? { path } : {}) });

export const hasErrors = (diagnostics: Diagnostic[]): boolean =>
  diagnostics.some(item => item.level === 'error');
