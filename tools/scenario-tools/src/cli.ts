/* eslint-disable no-console -- CLI output is the command's public interface. */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { ContentPack } from '../../../src/content/types';
import { compilePuzzleGraph } from '../../../src/scenario/puzzleGraph';
import type { Scenario } from '../../../src/scenario/types';
import { buildAuthoringGraph, renderAuthoringGraph, type GraphFormat } from './graph';
import { lintValue } from './lint';
import { loadInput } from './loader';
import { migrateSaveFile, parseFlagValue } from './migrate';
import { packDirectory } from './pack';
import { solveAuthoredValue, type SolveExpectation } from './solve';
import type { Diagnostic } from './types';

const HELP = `xp-scenario <command> [options]

Commands:
  lint <scenario|graph|pack>       Run structural and semantic authoring checks
  solve <scenario|graph|pack>      Replay the canonical walkthrough headlessly
  graph <scenario|graph|pack>      Render dependencies as Mermaid, DOT, or JSON
  pack <directory>                 Validate and normalize a content pack
  migrate <scenario> <save>        Diagnose or explicitly repair saved progress
  serve <scenario|graph|pack>      Run the live desktop authoring REPL

Common options:
  --json                           Emit machine-readable JSON
  --help                           Show command help

Serve options:
  --ui / --no-ui                   Open Scenario Studio (default) or desktop-only preview
  --no-open                        Do not launch a browser (safe for headless environments)

Pack options:
  --format json|xpspack            Output format (default: json)
  --compress none|gzip|brotli      Payload compression (xpspack only; default: none)
  --out <file>                     Output path
  --check                          Validate and measure without writing
  --sign-key-env <name>            Read an Ed25519 private key PEM from this environment variable
  --sign-key-id <id>               Publisher key id recorded in the signed manifest
`;

interface ParsedArgs {
  positionals: string[];
  flags: Map<string, string[]>;
}

const parseArgs = (args: string[]): ParsedArgs => {
  const positionals: string[] = [];
  const flags = new Map<string, string[]>();
  const booleanFlags = new Set([
    'json',
    'check',
    'write',
    'drop-orphans',
    'ui',
    'no-ui',
    'no-open',
    'help',
  ]);
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg.startsWith('--')) {
      positionals.push(arg);
      continue;
    }
    const [rawName, inline] = arg.slice(2).split('=', 2);
    const value =
      inline ??
      (booleanFlags.has(rawName)
        ? 'true'
        : args[index + 1]?.startsWith('--')
          ? undefined
          : args[++index]);
    if (value === undefined) throw new Error(`option --${rawName} requires a value`);
    flags.set(rawName, [...(flags.get(rawName) ?? []), value]);
  }
  return { positionals, flags };
};

const flag = (args: ParsedArgs, name: string): string | undefined => {
  const values = args.flags.get(name);
  return values?.[values.length - 1];
};
const allFlags = (args: ParsedArgs, name: string): string[] => args.flags.get(name) ?? [];
const enabled = (args: ParsedArgs, name: string): boolean => flag(args, name) === 'true';

const printDiagnostics = (diagnostics: Diagnostic[]): void => {
  if (diagnostics.length === 0) {
    console.log('OK: no diagnostics');
    return;
  }
  diagnostics.forEach(item => {
    const where = item.path ? ` (${item.path})` : '';
    console.log(`${item.level.toUpperCase()} [${item.code}]${where}: ${item.message}`);
  });
};

const mapping = (values: string[], option: string): Record<string, string> =>
  Object.fromEntries(
    values.map(value => {
      const index = value.indexOf('=');
      if (index <= 0 || index === value.length - 1) {
        throw new Error(`${option} expects old=new, got "${value}"`);
      }
      return [value.slice(0, index), value.slice(index + 1)];
    })
  );

const expectations = (values: string[]): SolveExpectation[] =>
  values.map(value => {
    const index = value.indexOf('=');
    return index < 0
      ? { flag: value, value: true }
      : { flag: value.slice(0, index), value: parseFlagValue(value.slice(index + 1)) };
  });

const commandLint = async (args: ParsedArgs): Promise<number> => {
  const inputPath = args.positionals[0];
  if (!inputPath) throw new Error('lint requires an input path');
  const input = await loadInput(inputPath);
  const result = await lintValue(input.kind, input.value, { baseDir: input.baseDir });
  if (enabled(args, 'json')) console.log(JSON.stringify(result, null, 2));
  else printDiagnostics(result.diagnostics);
  return result.ok ? 0 : 1;
};

const commandSolve = async (args: ParsedArgs): Promise<number> => {
  const inputPath = args.positionals[0];
  if (!inputPath) throw new Error('solve requires an input path');
  const input = await loadInput(inputPath);
  const lint = await lintValue(input.kind, input.value, { baseDir: input.baseDir });
  if (!lint.ok) {
    if (enabled(args, 'json')) console.log(JSON.stringify(lint, null, 2));
    else printDiagnostics(lint.diagnostics);
    return 1;
  }
  const eventsFile = flag(args, 'events');
  let events: NonNullable<Parameters<typeof solveAuthoredValue>[2]>['events'];
  if (eventsFile) {
    const parsed = JSON.parse(await readFile(path.resolve(eventsFile), 'utf8')) as unknown;
    events = (
      Array.isArray(parsed) ? parsed : (parsed as { events?: unknown[] }).events
    ) as typeof events;
    if (!Array.isArray(events))
      throw new Error('--events file must contain an event array or `{ "events": [...] }`');
  }
  const report = await solveAuthoredValue(input.kind, input.value, {
    ...(events ? { events } : {}),
    expect: expectations(allFlags(args, 'expect')),
    baseDir: input.baseDir,
  });
  if (enabled(args, 'json')) console.log(JSON.stringify(report, null, 2));
  else {
    console.log(`Scenario: ${report.scenarioId}`);
    report.steps.forEach(step => {
      const fired = step.fired.length ? step.fired.join(', ') : '-';
      console.log(
        `${String(step.index).padStart(3)}  ${step.event}${step.beat ? ` [${step.beat}]` : ''}  -> ${fired}`
      );
    });
    console.log(`Final flags: ${JSON.stringify(report.result.flags)}`);
    console.log(`Provider fallback nodes: ${report.providerFallbacks}`);
    report.missing.forEach(item => console.log(`ERROR: expected ${item}`));
  }
  return report.ok ? 0 : 1;
};

const commandGraph = async (args: ParsedArgs): Promise<number> => {
  const inputPath = args.positionals[0];
  if (!inputPath) throw new Error('graph requires an input path');
  const format = (flag(args, 'format') ?? 'mermaid') as GraphFormat;
  if (!['mermaid', 'dot', 'json'].includes(format))
    throw new Error(`unsupported graph format: ${format}`);
  const input = await loadInput(inputPath);
  const output = renderAuthoringGraph(buildAuthoringGraph(input.kind, input.value), format);
  const outputFile = flag(args, 'out');
  if (outputFile) await writeFile(path.resolve(outputFile), output, 'utf8');
  else process.stdout.write(output);
  return 0;
};

const commandPack = async (args: ParsedArgs): Promise<number> => {
  const directory = args.positionals[0];
  if (!directory) throw new Error('pack requires a directory');
  const format = flag(args, 'format') ?? 'json';
  if (!['json', 'xpspack'].includes(format)) throw new Error(`unsupported pack format: ${format}`);
  const compression = flag(args, 'compress') ?? 'none';
  if (!['none', 'gzip', 'brotli'].includes(compression))
    throw new Error(`unsupported compression: ${compression}`);
  const signingKeyEnv = flag(args, 'sign-key-env');
  const signingKeyId = flag(args, 'sign-key-id');
  if ((signingKeyEnv || signingKeyId) && format !== 'xpspack')
    throw new Error('signing is only supported with --format xpspack');
  if (signingKeyEnv && !signingKeyId) throw new Error('--sign-key-env requires --sign-key-id');
  if (signingKeyId && !signingKeyEnv) throw new Error('--sign-key-id requires --sign-key-env');
  const signingKey = signingKeyEnv ? process.env[signingKeyEnv] : undefined;
  if (signingKeyEnv && !signingKey)
    throw new Error(`signing key environment variable is missing or empty: ${signingKeyEnv}`);
  const result = await packDirectory(directory, {
    check: enabled(args, 'check'),
    output: flag(args, 'out'),
    format: format as 'json' | 'xpspack',
    compression: compression as 'none' | 'gzip' | 'brotli',
    ...(signingKey && signingKeyId
      ? { signing: { keyId: signingKeyId, privateKey: signingKey } }
      : {}),
  });
  if (enabled(args, 'json')) console.log(JSON.stringify(result, null, 2));
  else {
    printDiagnostics(result.diagnostics);
    console.log(
      `Size: logic ${result.report.logicBytes} B, scenario ${result.report.scenarioBytes} B, assets ${result.report.assetBytes} B, packed ${result.report.totalBytes} B`
    );
    console.log(`Transfer: ${result.report.transferredBytes} B (${result.format})`);
    result.report.chunks.forEach(chunk =>
      console.log(
        `  chunk ${chunk.id}: ${chunk.rawBytes} B -> ${chunk.storedBytes} B (${chunk.compression})`
      )
    );
    result.report.assets.forEach(asset =>
      console.log(
        `  ${asset.key}: ${asset.bytes === null ? 'remote/unknown' : `${asset.bytes} B`} (${asset.source})`
      )
    );
    if (result.output) console.log(`Output: ${result.output}`);
  }
  return result.ok ? 0 : 1;
};

const scenarioFromInput = (input: Awaited<ReturnType<typeof loadInput>>): Scenario => {
  if (input.kind === 'scenario') return input.value as Scenario;
  if (input.kind === 'graph')
    return compilePuzzleGraph(input.value as Parameters<typeof compilePuzzleGraph>[0]);
  const scenario = (input.value as ContentPack).scenario;
  if (!scenario) throw new Error('content pack does not declare a scenario');
  return scenario;
};

const commandMigrate = async (args: ParsedArgs): Promise<number> => {
  const [scenarioFile, saveFile] = args.positionals;
  if (!scenarioFile || !saveFile) throw new Error('migrate requires <scenario> <save>');
  const input = await loadInput(scenarioFile);
  const result = await migrateSaveFile(scenarioFromInput(input), saveFile, {
    flags: mapping(allFlags(args, 'map-flag'), '--map-flag'),
    triggers: mapping(allFlags(args, 'map-trigger'), '--map-trigger'),
    dropOrphans: enabled(args, 'drop-orphans'),
    write: enabled(args, 'write'),
    output: flag(args, 'out'),
  });
  if (enabled(args, 'json')) console.log(JSON.stringify(result, null, 2));
  else {
    printDiagnostics(result.diagnostics);
    console.log(
      result.changed ? 'Save requires migration.' : 'Save is compatible without changes.'
    );
    if (result.output) console.log(`Output: ${result.output}`);
  }
  return result.ok ? 0 : 1;
};

const portOption = (args: ParsedArgs, name: string): number | undefined => {
  const value = flag(args, name);
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 65535)
    throw new Error(`--${name} must be an integer between 0 and 65535`);
  return parsed;
};

const commandServe = async (args: ParsedArgs): Promise<number> => {
  const inputPath = args.positionals[0];
  if (!inputPath) throw new Error('serve requires an input path');
  const { serveScenario } = await import('./serve');
  if (enabled(args, 'ui') && enabled(args, 'no-ui'))
    throw new Error('--ui and --no-ui cannot be used together');
  await serveScenario(inputPath, {
    host: flag(args, 'host'),
    port: portOption(args, 'port'),
    controlPort: portOption(args, 'control-port'),
    open: !enabled(args, 'no-open'),
    providerUrl: flag(args, 'provider-url'),
    language: flag(args, 'language'),
    ui: enabled(args, 'no-ui') ? false : true,
  });
  return 0;
};

export const runCli = async (argv = process.argv.slice(2)): Promise<number> => {
  const command = argv[0];
  if (!command || command === '--help' || command === 'help') {
    console.log(HELP);
    return 0;
  }
  const args = parseArgs(argv.slice(1));
  if (enabled(args, 'help')) {
    console.log(HELP);
    return 0;
  }
  if (command === 'lint') return commandLint(args);
  if (command === 'solve') return commandSolve(args);
  if (command === 'graph') return commandGraph(args);
  if (command === 'pack') return commandPack(args);
  if (command === 'migrate') return commandMigrate(args);
  if (command === 'serve') return commandServe(args);
  throw new Error(`unknown command "${command}"\n\n${HELP}`);
};

runCli()
  .then(code => {
    process.exitCode = code;
  })
  .catch(error => {
    console.error(`xp-scenario: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
