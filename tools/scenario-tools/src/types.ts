import type { ContentPack } from '../../../src/content/types';
import type { PuzzleGraph } from '../../../src/scenario/puzzleGraph';
import type { Scenario } from '../../../src/scenario/types';

export type AuthoringValue = Scenario | PuzzleGraph | ContentPack;
export type AuthoringKind = 'scenario' | 'graph' | 'pack';
export type DiagnosticLevel = 'error' | 'warning' | 'info';

export interface SourcePosition {
  line: number;
  column: number;
}

export interface SourceRange {
  start: SourcePosition;
  end: SourcePosition;
}

export interface RelatedDiagnostic {
  message: string;
  path?: string;
  source?: string;
  range?: SourceRange;
}

export interface Diagnostic {
  level: DiagnosticLevel;
  code: string;
  message: string;
  path?: string;
  source?: string;
  range?: SourceRange;
  help?: string;
  related?: RelatedDiagnostic[];
  docsUrl?: string;
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
