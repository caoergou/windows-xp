import type { XPEvent } from '../../../src/events';
import type { FlagValue } from '../../../src/scenario/types';
import type { ScenarioDebugState } from '../../../src/devtools/rehearsalChannel';
import type { QQProfile } from '../../../src/data/qq/types';
import { KNOWN_EVENT_TYPES } from './eventTypes';

export type ReplCommand =
  | { kind: 'help' }
  | { kind: 'seek'; beat: string }
  | { kind: 'step'; direction: 'back' | 'forward' }
  | { kind: 'exit-rehearsal' }
  | { kind: 'flags' }
  | { kind: 'flag-set'; flag: string; value: FlagValue }
  | { kind: 'status' }
  | { kind: 'emit'; event: XPEvent }
  | { kind: 'lint' }
  | { kind: 'graph'; format: 'mermaid' | 'dot' | 'json' }
  | { kind: 'reset' }
  | { kind: 'chat'; buddy: string; message: string; offline: boolean }
  | { kind: 'quit' };

export interface CompletionContext {
  beats: string[];
  flags: string[];
  buddies: string[];
}

export type BrowserCommand =
  | { type: 'seek'; beat: string }
  | { type: 'step'; direction: 'back' | 'forward' }
  | { type: 'exit-rehearsal' }
  | { type: 'flags' }
  | { type: 'flag-set'; flag: string; value: FlagValue }
  | { type: 'status' }
  | { type: 'emit'; event: XPEvent }
  | { type: 'reset' }
  | { type: 'chat'; buddy: string; text: string; profile?: QQProfile };

export interface ControlRequest {
  type: 'command';
  id: string;
  command: BrowserCommand;
}

export type BrowserMessage =
  | {
      type: 'ready';
      scenarioId: string;
      triggerCount: number;
      beats: string[];
    }
  | { type: 'response'; id: string; ok: true; data?: unknown }
  | { type: 'response'; id: string; ok: false; error: string }
  | { type: 'event'; event: XPEvent };

export const SERVE_HELP = `Commands:
  seek <beat>                         Jump to a named rehearsal beat
  step back|forward                   Move one rehearsal step
  exit                                Leave rehearsal and restore the live save
  flags                               Print current scenario flags
  flag set <name> <value>             Set a string/number/boolean flag
  status                              Print trigger budgets and condition traces
  emit <event> [key=value ...]        Inject a typed XP event
  lint                                Re-run static checks on the current file
  graph [mermaid|dot|json]             Print the current dependency graph
  chat [--offline] <buddy> [message]  Rehearse a provider or fallback reply
  reset                               Clear desktop state and reload
  help                                Show this help
  quit                                Stop the authoring server`;

const tokenize = (line: string): string[] => {
  const tokens: string[] = [];
  let current = '';
  let quote = '';
  let escaped = false;
  let depth = 0;
  for (const character of line.trim()) {
    if (escaped) {
      current += character;
      escaped = false;
      continue;
    }
    if (character === '\\') {
      current += character;
      escaped = true;
      continue;
    }
    if (quote) {
      current += character;
      if (character === quote) quote = '';
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      current += character;
      continue;
    }
    if (character === '[' || character === '{') depth += 1;
    if (character === ']' || character === '}') depth = Math.max(0, depth - 1);
    if (/\s/.test(character) && depth === 0) {
      if (current) tokens.push(current);
      current = '';
    } else {
      current += character;
    }
  }
  if (quote || depth !== 0) throw new Error('unterminated quote or JSON value');
  if (current) tokens.push(current);
  return tokens;
};

const parseValue = (raw: string): FlagValue | string[] => {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (
      typeof parsed === 'string' ||
      typeof parsed === 'number' ||
      typeof parsed === 'boolean' ||
      (Array.isArray(parsed) && parsed.every(value => typeof value === 'string'))
    ) {
      return parsed;
    }
  } catch {
    // Unquoted text is a string in the authoring REPL.
  }
  if (raw.startsWith("'") && raw.endsWith("'")) return raw.slice(1, -1);
  return raw;
};

export const parseReplCommand = (line: string): ReplCommand | null => {
  const tokens = tokenize(line);
  if (tokens.length === 0) return null;
  const [command, ...rest] = tokens;
  if (command === 'help' || command === '?') return { kind: 'help' };
  if (command === 'quit' || command === 'q') return { kind: 'quit' };
  if (command === 'seek') {
    if (!rest[0]) throw new Error('seek requires a beat name');
    return { kind: 'seek', beat: rest[0] };
  }
  if (command === 'step') {
    if (rest[0] !== 'back' && rest[0] !== 'forward')
      throw new Error('step expects back or forward');
    return { kind: 'step', direction: rest[0] };
  }
  if (command === 'exit') return { kind: 'exit-rehearsal' };
  if (command === 'flags') return { kind: 'flags' };
  if (command === 'flag') {
    if (rest[0] !== 'set' || !rest[1] || rest[2] === undefined)
      throw new Error('flag expects: flag set <name> <value>');
    const value = parseValue(rest.slice(2).join(' '));
    if (Array.isArray(value)) throw new Error('scenario flags cannot be arrays');
    return { kind: 'flag-set', flag: rest[1], value };
  }
  if (command === 'status') return { kind: 'status' };
  if (command === 'emit') {
    const [eventType, ...fields] = rest;
    if (!eventType) throw new Error('emit requires an event type');
    if (!KNOWN_EVENT_TYPES.has(eventType)) throw new Error(`unknown XP event type "${eventType}"`);
    const event: Record<string, unknown> = { type: eventType };
    fields.forEach(field => {
      const equals = field.indexOf('=');
      if (equals <= 0) throw new Error(`event field expects key=value, got "${field}"`);
      event[field.slice(0, equals)] = parseValue(field.slice(equals + 1));
    });
    return { kind: 'emit', event: event as XPEvent };
  }
  if (command === 'lint') return { kind: 'lint' };
  if (command === 'graph') {
    const format = rest[0] ?? 'mermaid';
    if (format !== 'mermaid' && format !== 'dot' && format !== 'json')
      throw new Error('graph format must be mermaid, dot, or json');
    return { kind: 'graph', format };
  }
  if (command === 'reset') return { kind: 'reset' };
  if (command === 'chat') {
    const offline = rest.includes('--offline');
    const values = rest.filter(value => value !== '--offline');
    if (!values[0]) throw new Error('chat requires a buddy id');
    const rawMessage = values.slice(1).join(' ');
    const parsedMessage = rawMessage ? parseValue(rawMessage) : 'Hello';
    const message = Array.isArray(parsedMessage) ? parsedMessage.join(' ') : String(parsedMessage);
    return { kind: 'chat', buddy: values[0], message, offline };
  }
  throw new Error(`unknown command "${command}"`);
};

const COMMANDS = [
  'seek',
  'step',
  'exit',
  'flags',
  'flag',
  'status',
  'emit',
  'lint',
  'graph',
  'chat',
  'reset',
  'help',
  'quit',
];

export const completeRepl = (line: string, context: CompletionContext): [string[], string] => {
  const parts = line.split(/\s+/);
  const current = parts[parts.length - 1] ?? '';
  let candidates = COMMANDS;
  if (parts[0] === 'seek' && parts.length === 2) candidates = context.beats;
  else if (parts[0] === 'step' && parts.length === 2) candidates = ['back', 'forward'];
  else if (parts[0] === 'emit' && parts.length === 2) candidates = [...KNOWN_EVENT_TYPES];
  else if (parts[0] === 'flag' && parts.length === 2) candidates = ['set'];
  else if (parts[0] === 'flag' && parts[1] === 'set' && parts.length === 3)
    candidates = context.flags;
  else if (parts[0] === 'graph' && parts.length === 2) candidates = ['mermaid', 'dot', 'json'];
  else if (parts[0] === 'chat' && parts.length <= 3) candidates = ['--offline', ...context.buddies];
  const matches = candidates.filter(candidate => candidate.startsWith(current)).sort();
  return [matches.length ? matches : candidates, current];
};

export const formatDebugState = (state: ScenarioDebugState): string => {
  const lines = [
    `Scenario: ${state.scenarioId ?? '(none)'}`,
    `Journal: ${state.journalLength} event(s); pending: ${state.pending.length}`,
    `Rehearsal: ${state.rehearsal.active ? state.rehearsal.index : 'live'} / ${state.rehearsal.length}`,
  ];
  state.triggers.forEach(trigger => {
    const budget = trigger.budgetAvailable ? 'ready' : 'spent';
    const condition = trigger.when.held ? 'when=true' : 'when=false';
    lines.push(
      `  ${trigger.id} [${Array.isArray(trigger.on) ? trigger.on.join('|') : trigger.on}] fires=${trigger.fireCount} ${budget} ${condition}`
    );
  });
  return lines.join('\n');
};
