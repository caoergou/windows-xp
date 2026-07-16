import { randomBytes } from 'node:crypto';
import { access, readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { createInterface } from 'node:readline';
import type { AddressInfo } from 'node:net';
import { WebSocket, WebSocketServer, type VerifyClientCallbackSync } from 'ws';
import { createServer, type ViteDevServer } from 'vite';
import type { ContentPack } from '../../../src/content/types';
import { compilePuzzleGraph } from '../../../src/scenario/puzzleGraph';
import type { Scenario } from '../../../src/scenario/types';
import type { ScenarioDebugState } from '../../../src/devtools/rehearsalChannel';
import { buildAuthoringGraph, renderAuthoringGraph } from './graph';
import { lintValue } from './lint';
import { loadInput } from './loader';
import { collectFlagUsage } from './walk';
import type { LoadedInput } from './types';
import { buildBrowserClientSource } from './serveClient';
import { buildRehearsalProfile, collectBuddies, isRecord, replyTexts } from './serveChat';
import {
  completeRepl,
  formatDebugState,
  parseReplCommand,
  SERVE_HELP,
  type BrowserCommand,
  type BrowserMessage,
  type CompletionContext,
  type ReplCommand,
} from './serveProtocol';

export interface ServeOptions {
  host?: string;
  port?: number;
  controlPort?: number;
  open?: boolean;
  providerUrl?: string;
  language?: string;
  output?: NodeJS.WritableStream;
}

export interface ScenarioAuthoringServer {
  url: string;
  controlUrl: string;
  completion: CompletionContext;
  execute: (command: ReplCommand) => Promise<string>;
  close: () => Promise<void>;
}

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

const virtualClientId = 'virtual:xp-scenario-authoring-client';
const resolvedClientId = `\0${virtualClientId}`;
const fsModule = (file: string): string => `/@fs/${file.split(path.sep).join('/')}`;
const scenarioFromInput = (input: LoadedInput): Scenario => {
  if (input.kind === 'scenario') return input.value as Scenario;
  if (input.kind === 'graph')
    return compilePuzzleGraph(input.value as Parameters<typeof compilePuzzleGraph>[0]);
  const scenario = (input.value as ContentPack).scenario;
  if (!scenario) throw new Error('content pack does not declare a scenario');
  return scenario;
};

const findProjectRoot = async (start: string): Promise<string> => {
  let current = start;
  while (true) {
    try {
      await access(path.join(current, 'package.json'));
      return current;
    } catch {
      const parent = path.dirname(current);
      if (parent === current) return start;
      current = parent;
    }
  }
};

const resolveEngine = async (projectRoot: string): Promise<{ module: string; root: string }> => {
  const require = createRequire(path.join(projectRoot, 'package.json'));
  let packageFile: string;
  try {
    packageFile = require.resolve('@caoergou/windows-xp/package.json');
  } catch {
    throw new Error(
      'serve requires @caoergou/windows-xp in the authoring project (install it beside @caoergou/xp-scenario-tools)'
    );
  }
  const engineRoot = path.dirname(packageFile);
  const sourceEntry = path.join(engineRoot, 'src/lib/index.tsx');
  try {
    await access(sourceEntry);
    return { module: fsModule(sourceEntry), root: engineRoot };
  } catch {
    const metadata = JSON.parse(await readFile(packageFile, 'utf8')) as {
      exports?: { '.'?: { import?: string } };
      module?: string;
    };
    const relative = metadata.exports?.['.']?.import ?? metadata.module;
    if (!relative) throw new Error('@caoergou/windows-xp does not expose an ESM entry');
    return { module: fsModule(path.resolve(engineRoot, relative)), root: engineRoot };
  }
};

const completionFor = (input: LoadedInput): CompletionContext => {
  const scenario = scenarioFromInput(input);
  const usage = collectFlagUsage(scenario);
  Object.keys(scenario.initialFlags ?? {}).forEach(flag => usage.set.add(flag));
  return {
    beats: scenario.rehearsal?.walkthrough.map(step => step.beat).filter(Boolean) as string[],
    flags: [...new Set([...usage.read, ...usage.set])].sort(),
    buddies: collectBuddies(input.value).map(item => item.id),
  };
};

const listenWebSocket = (server: WebSocketServer): Promise<void> =>
  new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });

const closeWebSocket = (server: WebSocketServer): Promise<void> =>
  new Promise(resolve => server.close(() => resolve()));

export const startScenarioServer = async (
  inputPath: string,
  options: ServeOptions = {}
): Promise<ScenarioAuthoringServer> => {
  const host = options.host ?? '127.0.0.1';
  const port = options.port ?? 5173;
  const controlPort = options.controlPort ?? 5174;
  const output = options.output ?? process.stdout;
  const token = randomBytes(24).toString('base64url');
  let currentInput = await loadInput(inputPath);
  let completion = completionFor(currentInput);
  const projectRoot = await findProjectRoot(currentInput.baseDir);
  const engine = await resolveEngine(projectRoot);
  const clients = new Set<WebSocket>();
  const pending = new Map<string, PendingRequest>();
  let nextRequest = 0;
  let closed = false;
  let reloadTimer: ReturnType<typeof setTimeout> | undefined;

  const verifyClient: VerifyClientCallbackSync = ({ req }) => {
    const requestUrl = new URL(req.url ?? '/', `ws://${req.headers.host ?? 'localhost'}`);
    return requestUrl.searchParams.get('token') === token;
  };
  const controlServer = new WebSocketServer({
    host,
    port: controlPort,
    maxPayload: 1024 * 1024,
    verifyClient,
  });
  await listenWebSocket(controlServer);
  const controlAddress = controlServer.address() as AddressInfo;
  const publicHost = host === '127.0.0.1' || host === '0.0.0.0' ? 'localhost' : host;
  const controlUrl = `ws://${publicHost}:${controlAddress.port}?token=${token}`;

  const rejectPending = (message: string) => {
    pending.forEach(item => {
      clearTimeout(item.timer);
      item.reject(new Error(message));
    });
    pending.clear();
  };

  controlServer.on('connection', socket => {
    clients.add(socket);
    socket.on('close', () => clients.delete(socket));
    socket.on('message', raw => {
      let message: BrowserMessage;
      try {
        message = JSON.parse(raw.toString()) as BrowserMessage;
      } catch {
        return;
      }
      if (message.type === 'response') {
        const item = pending.get(message.id);
        if (!item) return;
        clearTimeout(item.timer);
        pending.delete(message.id);
        if (message.ok) item.resolve(message.data);
        else item.reject(new Error(message.error));
      } else if (message.type === 'event') {
        output.write(`\n[event] ${message.event.type} ${JSON.stringify(message.event)}\n`);
      } else if (message.type === 'ready') {
        completion.beats = message.beats;
        output.write(
          `\n[connected] ${message.scenarioId}: ${message.triggerCount} trigger(s), ${message.beats.length} beat(s)\n`
        );
      }
    });
  });

  const requestBrowser = (command: BrowserCommand): Promise<unknown> => {
    const client = [...clients].find(socket => socket.readyState === WebSocket.OPEN);
    if (!client) throw new Error('browser control channel is not connected');
    const id = `command-${++nextRequest}`;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error(`browser command timed out: ${command.type}`));
      }, 5000);
      pending.set(id, { resolve, reject, timer });
      client.send(JSON.stringify({ type: 'command', id, command }));
    });
  };

  const chatCursor = new Map<string, number>();
  const rehearseChat = async (command: Extract<ReplCommand, { kind: 'chat' }>): Promise<string> => {
    const buddy = collectBuddies(currentInput.value).find(item => item.id === command.buddy);
    const reply = (buddy?.value.reply ?? {}) as Record<string, unknown>;
    let text: string;
    if (command.offline) {
      if (!buddy)
        throw new Error(`no provider/script buddy "${command.buddy}" in the authored input`);
      const candidates = replyTexts(
        reply.fallback ?? (reply.kind === 'script' ? reply : undefined)
      );
      if (candidates.length === 0)
        throw new Error(`buddy "${command.buddy}" has no offline fallback/script`);
      const index = chatCursor.get(command.buddy) ?? 0;
      text = candidates[index % candidates.length];
      chatCursor.set(command.buddy, index + 1);
    } else if (options.providerUrl) {
      const response = await fetch(options.providerUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          buddy: command.buddy,
          message: command.message,
          persona: buddy?.value.persona ?? reply.persona,
          context: reply.context,
        }),
      });
      if (!response.ok) throw new Error(`chat provider returned HTTP ${response.status}`);
      const contentType = response.headers.get('content-type') ?? '';
      const body = contentType.includes('application/json')
        ? ((await response.json()) as unknown)
        : await response.text();
      text =
        typeof body === 'string'
          ? body
          : isRecord(body) && typeof body.text === 'string'
            ? body.text
            : '';
      if (!text.trim())
        throw new Error('chat provider response must be text or { "text": string }');
    } else {
      text = `[mock:${command.buddy}] ${command.message}`;
    }
    await requestBrowser({
      type: 'chat',
      buddy: command.buddy,
      text,
      ...(buddy ? { profile: buildRehearsalProfile(buddy) } : {}),
    });
    return `${command.buddy}: ${text}`;
  };

  const execute = async (command: ReplCommand): Promise<string> => {
    if (command.kind === 'help') return SERVE_HELP;
    if (command.kind === 'quit') return '';
    if (command.kind === 'lint') {
      const result = await lintValue(currentInput.kind, currentInput.value, {
        baseDir: currentInput.baseDir,
      });
      if (result.diagnostics.length === 0) return 'OK: no diagnostics';
      return result.diagnostics
        .map(item => `${item.level.toUpperCase()} [${item.code}]: ${item.message}`)
        .join('\n');
    }
    if (command.kind === 'graph') {
      return renderAuthoringGraph(
        buildAuthoringGraph(currentInput.kind, currentInput.value),
        command.format
      ).trimEnd();
    }
    if (command.kind === 'chat') return rehearseChat(command);
    let browserCommand: BrowserCommand;
    if (command.kind === 'seek') browserCommand = { type: 'seek', beat: command.beat };
    else if (command.kind === 'step')
      browserCommand = { type: 'step', direction: command.direction };
    else if (command.kind === 'exit-rehearsal') browserCommand = { type: 'exit-rehearsal' };
    else if (command.kind === 'flags') browserCommand = { type: 'flags' };
    else if (command.kind === 'flag-set')
      browserCommand = { type: 'flag-set', flag: command.flag, value: command.value };
    else if (command.kind === 'status') browserCommand = { type: 'status' };
    else if (command.kind === 'emit') browserCommand = { type: 'emit', event: command.event };
    else browserCommand = { type: 'reset' };
    const response = await requestBrowser(browserCommand);
    if (command.kind === 'status') return formatDebugState(response as ScenarioDebugState);
    if (command.kind === 'emit') {
      return `Emitted ${command.event.type}\n${formatDebugState(response as ScenarioDebugState)}`;
    }
    return JSON.stringify(response, null, 2);
  };

  const browserSource = () =>
    buildBrowserClientSource({
      engineModule: engine.module,
      scenarioModule: fsModule(currentInput.file),
      controlUrl,
      storagePrefix: `xp-scenario-serve:${path.resolve(currentInput.file)}:`,
      language: options.language ?? 'zh',
    });

  let vite: ViteDevServer;
  try {
    vite = await createServer({
      root: projectRoot,
      base: '/',
      configFile: false,
      appType: 'custom',
      clearScreen: false,
      logLevel: 'warn',
      optimizeDeps: { include: ['react', 'react-dom/client'], exclude: ['@caoergou/windows-xp'] },
      resolve: { dedupe: ['react', 'react-dom', 'styled-components'] },
      server: {
        host,
        port,
        strictPort: true,
        open: options.open === false ? false : '/',
        fs: { allow: [projectRoot, engine.root, currentInput.baseDir] },
      },
      plugins: [
        {
          name: 'xp-scenario-authoring-client',
          resolveId(id) {
            return id === virtualClientId ? resolvedClientId : undefined;
          },
          load(id) {
            return id === resolvedClientId ? browserSource() : undefined;
          },
          configureServer(server) {
            server.middlewares.use((request, response, next) => {
              const pathname = new URL(request.url ?? '/', 'http://localhost').pathname;
              if (pathname !== '/') return next();
              response.statusCode = 200;
              response.setHeader('content-type', 'text/html; charset=utf-8');
              response.end(`<!doctype html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>XP Scenario Authoring</title>
<style>html,body,#root{width:100%;height:100%;margin:0;overflow:hidden}body{background:#000}</style></head>
<body><div id="root"></div><script type="module" src="/@id/${virtualClientId}"></script></body></html>`);
            });
          },
        },
      ],
    });
  } catch (error) {
    await closeWebSocket(controlServer);
    throw error;
  }

  const reloadInput = async () => {
    try {
      currentInput = await loadInput(currentInput.file);
      completion = completionFor(currentInput);
      const result = await lintValue(currentInput.kind, currentInput.value, {
        baseDir: currentInput.baseDir,
      });
      output.write(
        `\n[reload] ${path.basename(currentInput.file)}: ${result.ok ? 'valid' : 'invalid'} (${result.diagnostics.length} diagnostic(s))\n`
      );
      result.diagnostics.forEach(item =>
        output.write(`  ${item.level.toUpperCase()} [${item.code}]: ${item.message}\n`)
      );
      vite.ws.send({ type: 'full-reload' });
    } catch (error) {
      output.write(`\n[reload] ${error instanceof Error ? error.message : String(error)}\n`);
    }
  };
  const onChange = (file: string) => {
    const relative = path.relative(currentInput.baseDir, path.resolve(file));
    if (relative.startsWith('..') || path.isAbsolute(relative)) return;
    if (reloadTimer) clearTimeout(reloadTimer);
    reloadTimer = setTimeout(() => void reloadInput(), 80);
  };
  vite.watcher.on('change', onChange);
  try {
    await vite.listen();
  } catch (error) {
    vite.watcher.off('change', onChange);
    await Promise.all([vite.close(), closeWebSocket(controlServer)]);
    throw error;
  }
  const url = vite.resolvedUrls?.local[0] ?? `http://${publicHost}:${port}/`;

  const close = async () => {
    if (closed) return;
    closed = true;
    if (reloadTimer) clearTimeout(reloadTimer);
    vite.watcher.off('change', onChange);
    rejectPending('authoring server stopped');
    clients.forEach(client => client.terminate());
    await Promise.all([vite.close(), closeWebSocket(controlServer)]);
  };

  return {
    url,
    controlUrl,
    get completion() {
      return completion;
    },
    execute,
    close,
  };
};

const runRepl = (server: ScenarioAuthoringServer, output: NodeJS.WritableStream): Promise<void> =>
  new Promise(resolve => {
    let replClosed = false;
    const repl = createInterface({
      input: process.stdin,
      output: output as NodeJS.WritableStream & NodeJS.ReadableStream,
      prompt: 'scenario> ',
      completer: (line: string) => completeRepl(line, server.completion),
    });
    output.write(`${SERVE_HELP}\n\n`);
    repl.prompt();
    const stop = () => repl.close();
    process.once('SIGINT', stop);
    process.once('SIGTERM', stop);
    let queue = Promise.resolve();
    repl.on('line', (line: string) => {
      queue = queue.then(async () => {
        if (replClosed) return;
        try {
          const command = parseReplCommand(line);
          if (command) {
            if (command.kind === 'quit') {
              repl.close();
              return;
            }
            const result = await server.execute(command);
            if (result) output.write(`${result}\n`);
          }
        } catch (error) {
          output.write(`ERROR: ${error instanceof Error ? error.message : String(error)}\n`);
        } finally {
          if (!replClosed) repl.prompt();
        }
      });
    });
    repl.on('close', () => {
      replClosed = true;
      process.off('SIGINT', stop);
      process.off('SIGTERM', stop);
      resolve();
    });
  });

export const serveScenario = async (
  inputPath: string,
  options: ServeOptions = {}
): Promise<void> => {
  const output = options.output ?? process.stdout;
  const server = await startScenarioServer(inputPath, options);
  output.write(`Desktop running at ${server.url}\n`);
  output.write(
    `Control channel: ${server.controlUrl.replace(/\?token=.*/, '?token=<redacted>')}\n`
  );
  try {
    await runRepl(server, output);
  } finally {
    await server.close();
  }
};
