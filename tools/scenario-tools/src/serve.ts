import { randomBytes } from 'node:crypto';
import { access, readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { createInterface } from 'node:readline';
import type { AddressInfo } from 'node:net';
import { WebSocket, WebSocketServer, type VerifyClientCallbackSync } from 'ws';
import { createServer, type ViteDevServer } from 'vite';
import type { ScenarioDebugState } from '../../../src/devtools/rehearsalChannel';
import { renderAuthoringGraph } from './graph';
import { loadInput } from './loader';
import type { LoadedInput } from './types';
import { collectFlagUsage } from './walk';
import { buildBrowserClientSource } from './serveClient';
import { buildAuthoringSnapshot, scenarioFromLoadedInput } from './authoringSnapshot';
import { buildRehearsalProfile, collectBuddies, isRecord, replyTexts } from './serveChat';
import {
  completeRepl,
  formatDebugState,
  isAuthoringCommandRequest,
  parseReplCommand,
  replToAuthoringCommand,
  SERVE_HELP,
  AUTHORING_PROTOCOL_VERSION,
  type AuthoringCommand,
  type BrowserCommand,
  type ClientMessage,
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
  ui?: boolean;
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
  const scenario = scenarioFromLoadedInput(input);
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
  const startedAt = new Date().toISOString();
  let revision = 1;
  let snapshot = await buildAuthoringSnapshot(currentInput, revision, {
    status: 'current',
    lastValidAt: startedAt,
  });
  const projectRoot = await findProjectRoot(currentInput.baseDir);
  const engine = await resolveEngine(projectRoot);
  const clients = new Set<WebSocket>();
  const pending = new Map<string, PendingRequest>();
  let nextRequest = 0;
  let closed = false;
  let reloadTimer: ReturnType<typeof setTimeout> | undefined;

  const broadcastSnapshot = () => {
    const message = JSON.stringify({ type: 'snapshot', snapshot });
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) client.send(message);
    });
  };

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
    socket.send(JSON.stringify({ type: 'snapshot', snapshot }));
    socket.on('close', () => clients.delete(socket));
    socket.on('message', raw => {
      let message: ClientMessage;
      try {
        message = JSON.parse(raw.toString()) as ClientMessage;
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
        snapshot = {
          ...snapshot,
          recentEvents: [...snapshot.recentEvents, message.event].slice(-100),
        };
        broadcastSnapshot();
        output.write(`\n[event] ${message.event.type} ${JSON.stringify(message.event)}\n`);
      } else if (message.type === 'ready') {
        completion.beats = message.beats;
        output.write(
          `\n[connected] ${message.scenarioId}: ${message.triggerCount} trigger(s), ${message.beats.length} beat(s)\n`
        );
        void requestBrowser({ type: 'status' })
          .then(runtime => {
            snapshot = { ...snapshot, runtime: runtime as ScenarioDebugState };
            broadcastSnapshot();
          })
          .catch(() => undefined);
      } else if (message.type === 'authoring-command') {
        if (message.protocolVersion !== AUTHORING_PROTOCOL_VERSION) {
          socket.send(
            JSON.stringify({
              type: 'authoring-result',
              id: message.id,
              protocolVersion: AUTHORING_PROTOCOL_VERSION,
              ok: false,
              error: `unsupported authoring protocol version: ${message.protocolVersion}`,
            })
          );
          return;
        }
        const candidate: unknown = message;
        if (!isAuthoringCommandRequest(candidate)) {
          socket.send(
            JSON.stringify({
              type: 'authoring-result',
              id: message.id,
              protocolVersion: AUTHORING_PROTOCOL_VERSION,
              ok: false,
              error: 'invalid authoring command payload',
            })
          );
          return;
        }
        void executeAuthoringCommand(message.command)
          .then(data =>
            socket.send(
              JSON.stringify({
                type: 'authoring-result',
                id: message.id,
                protocolVersion: AUTHORING_PROTOCOL_VERSION,
                ok: true,
                data,
              })
            )
          )
          .catch(error =>
            socket.send(
              JSON.stringify({
                type: 'authoring-result',
                id: message.id,
                protocolVersion: AUTHORING_PROTOCOL_VERSION,
                ok: false,
                error: error instanceof Error ? error.message : String(error),
              })
            )
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
  const rehearseChat = async (
    command: Extract<AuthoringCommand, { type: 'chat-rehearse' }>
  ): Promise<{ buddy: string; text: string; mode: string }> => {
    const buddy = collectBuddies(currentInput.value).find(item => item.id === command.buddy);
    const reply = (buddy?.value.reply ?? {}) as Record<string, unknown>;
    let text: string;
    if (command.mode === 'offline') {
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
    } else if (command.mode === 'provider' && options.providerUrl) {
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
    return { buddy: command.buddy, text, mode: command.mode };
  };

  const executeAuthoringCommand = async (command: AuthoringCommand): Promise<unknown> => {
    if (command.type === 'lint') return snapshot.lint;
    if (command.type === 'graph')
      return {
        graph: snapshot.graph,
        rendered: renderAuthoringGraph(snapshot.graph, command.format).trimEnd(),
      };
    if (command.type === 'chat-rehearse') return rehearseChat(command);

    const response = await requestBrowser(command);
    if (command.type === 'status' || command.type === 'emit') {
      snapshot = { ...snapshot, runtime: response as ScenarioDebugState };
      broadcastSnapshot();
    } else if (command.type !== 'reset') {
      try {
        const runtime = (await requestBrowser({ type: 'status' })) as ScenarioDebugState;
        snapshot = { ...snapshot, runtime };
        broadcastSnapshot();
      } catch {
        // The desktop may be resetting or reconnecting; the next ready message refreshes runtime.
      }
    }
    return response;
  };

  const execute = async (command: ReplCommand): Promise<string> => {
    if (command.kind === 'help') return SERVE_HELP;
    if (command.kind === 'quit') return '';
    const structured = replToAuthoringCommand(command);
    if (!structured) return '';
    const response = await executeAuthoringCommand(structured);
    if (command.kind === 'lint') {
      const result = snapshot.lint.result;
      if (!result || result.diagnostics.length === 0) return 'OK: no diagnostics';
      return result.diagnostics
        .map(item => `${item.level.toUpperCase()} [${item.code}]: ${item.message}`)
        .join('\n');
    }
    if (command.kind === 'graph') return (response as { rendered: string }).rendered;
    if (command.kind === 'chat') {
      const result = response as { buddy: string; text: string };
      return `${result.buddy}: ${result.text}`;
    }
    if (command.kind === 'status') return formatDebugState(response as ScenarioDebugState);
    if (command.kind === 'emit')
      return `Emitted ${command.event.type}\n${formatDebugState(response as ScenarioDebugState)}`;
    return JSON.stringify(response, null, 2);
  };

  const browserSource = () =>
    buildBrowserClientSource({
      engineModule: engine.module,
      authoredValue: currentInput.value,
      controlUrl,
      storagePrefix: `xp-scenario-serve:${path.resolve(currentInput.file)}:`,
      language: options.language ?? 'zh',
      workbench: options.ui !== false,
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
              if (pathname !== '/' && pathname !== '/preview') return next();
              response.statusCode = 200;
              response.setHeader('content-type', 'text/html; charset=utf-8');
              response.end(`<!doctype html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Scenario Studio</title>
<style>
:root{--panel-width:440px;--canvas:rgb(244 246 249);--surface:rgb(255 255 255);--surface-raised:rgb(250 251 252);--ink:rgb(25 31 42);--muted:rgb(100 110 126);--line:rgb(220 225 232);--accent:rgb(37 99 235);background:var(--canvas)}
html,body,#root{width:100%;height:100%;margin:0;overflow:hidden}header button,header input,.preview-meta select,aside button,aside input,aside select,aside textarea{font:inherit}header button,.preview-meta select,aside button,aside input,aside select,aside textarea{color:var(--ink);background:var(--surface);border:1px solid var(--line);border-radius:6px}header button,aside button{padding:6px 10px;cursor:pointer}header button:hover,aside button:hover{border-color:rgb(180 189 202);background:rgb(247 248 250)}header button:active,aside button:active{background:rgb(237 240 244)}header button:focus-visible,header input:focus-visible,.preview-meta select:focus-visible,aside button:focus-visible,aside input:focus-visible,aside select:focus-visible,aside textarea:focus-visible,aside [tabindex]:focus-visible{outline:2px solid var(--accent);outline-offset:2px}.workbench{display:grid;grid-template-rows:52px 1fr;width:100%;height:100%;color:var(--ink);background:var(--canvas)}header{font-family:Inter,"Segoe UI",ui-sans-serif,system-ui,sans-serif;display:flex;align-items:center;gap:12px;padding:8px 14px;border-bottom:1px solid var(--line);background:rgb(255 255 255 / 96%);box-shadow:0 1px 2px rgb(25 31 42 / 5%)}header>strong{margin-right:auto;font-size:14px;letter-spacing:-.01em}header span{font-size:12px;color:var(--muted)}header label{display:flex;align-items:center;gap:7px;font-size:12px;color:var(--muted)}header input[type=range]{accent-color:var(--accent)}.stale{color:rgb(180 83 9);font-weight:700}main{display:grid;grid-template-columns:minmax(0,1fr) var(--panel-width);min-height:0}.preview{position:relative;min-width:0;overflow:auto;padding:0 20px 20px;background:rgb(235 238 243)}.preview-meta{font-family:Inter,"Segoe UI",ui-sans-serif,system-ui,sans-serif;color:var(--muted);position:sticky;z-index:3;top:0;display:flex;justify-content:space-between;align-items:center;min-height:40px;margin:0 -20px 20px;padding:0 14px;border-bottom:1px solid var(--line);background:rgb(250 251 252 / 94%);backdrop-filter:blur(8px)}.preview-meta>strong{font-size:11px;letter-spacing:.08em;text-transform:uppercase}.preview-meta label{display:flex;align-items:center;gap:8px;font-size:12px}.preview-meta select{padding:5px 26px 5px 8px}#desktop-shell{height:calc(100% - 61px);max-width:100%;margin:auto;background:rgb(0 0 0);border:1px solid rgb(194 201 211);border-radius:4px;box-shadow:0 8px 24px rgb(38 45 58 / 14%);overflow:hidden}#desktop-frame{display:block;width:100%;height:100%;border:0;background:rgb(0 0 0)}#desktop-root{width:100%;height:100%}aside{font-family:Inter,"Segoe UI",ui-sans-serif,system-ui,sans-serif;min-width:0;overflow:hidden;border-left:1px solid var(--line);background:var(--surface)}nav[role=tablist]{display:flex;overflow-x:auto;padding:0 8px;border-bottom:1px solid var(--line);background:var(--surface-raised)}[role=tab]{min-height:40px;border:0;border-radius:0;background:transparent;color:var(--muted);text-transform:capitalize}[role=tab]:hover{border-color:transparent;background:transparent;color:var(--ink)}[role=tab][aria-selected=true]{color:var(--accent);font-weight:600;background:transparent;box-shadow:inset 0 -2px var(--accent)}#panel-content{height:calc(100% - 41px);padding:18px;overflow:auto}.gate-row{display:flex;align-items:center;gap:8px;margin-bottom:16px}.gate{padding:3px 8px;border-radius:999px;text-transform:uppercase;font-size:10px;font-weight:700;letter-spacing:.05em}.gate--pass{background:rgb(220 252 231);color:rgb(21 128 61)}.gate--fail{background:rgb(254 226 226);color:rgb(185 28 28)}.gate--unavailable{background:rgb(238 240 244);color:var(--muted)}.diagnostic,.buddy{display:grid;gap:6px;margin:10px 0;padding:12px;border:1px solid var(--line);border-left:3px solid rgb(148 158 173);border-radius:6px;background:var(--surface-raised)}.diagnostic--error{border-left-color:rgb(220 38 38)}.diagnostic--warning{border-left-color:rgb(217 119 6)}aside code,aside pre{font-family:"SFMono-Regular",Consolas,ui-monospace,monospace}aside code{font-size:11px}aside pre{overflow:auto;padding:12px;border:1px solid var(--line);border-radius:6px;background:rgb(247 248 250);white-space:pre-wrap}.story-map{width:100%;min-height:240px}.story-map text{fill:var(--ink);font-size:12px}.graph-node rect{fill:var(--surface);stroke:rgb(96 125 174)}.graph-edge{fill:none;stroke:rgb(165 174 188);stroke-width:2}.graph-edge--dependency{stroke:var(--accent)}.graph-edge--flag{stroke:rgb(124 58 237)}.graph-edge--content-ref{stroke:rgb(5 150 105)}.toolbar{display:flex;flex-wrap:wrap;gap:7px}.timeline{padding-left:24px}.timeline button{display:flex;justify-content:space-between;gap:12px;width:100%;margin:5px 0}.notice{font-size:12px;line-height:1.5;color:var(--muted)}aside label{display:grid;gap:6px;margin:10px 0;font-size:12px;color:var(--muted)}aside textarea,aside input,aside select{padding:8px}.buddy div{display:flex;gap:6px}.buddy>span{font-size:12px;color:var(--muted)}.shipping{display:grid;grid-template-columns:1fr auto;gap:10px}.shipping dt,.shipping dd{margin:0}.asset{display:grid;grid-template-columns:1fr 2fr auto;gap:8px;padding:8px 0;border-bottom:1px solid var(--line);font-size:12px}.toast{position:fixed;z-index:10;right:18px;bottom:18px;max-width:420px;padding:10px 14px;border-radius:7px;color:rgb(255 255 255);background:rgb(22 101 52);box-shadow:0 8px 24px rgb(25 31 42 / 18%)}.toast:empty{display:none}.toast--error{background:rgb(185 28 28)}.workbench--full main{grid-template-columns:1fr}.workbench--full aside,.workbench--full header label,.workbench--full #preview-lock{display:none}.workbench--desktop-only{grid-template-rows:1fr}.workbench--desktop-only header,.workbench--desktop-only aside,.workbench--desktop-only .preview-meta{display:none}.workbench--desktop-only main{display:block}.workbench--desktop-only #desktop-shell{width:100%;height:100%;max-width:none;border:0;border-radius:0;box-shadow:none}.workbench--desktop-only #desktop-shell[inert]{pointer-events:auto}.workbench--desktop-only .preview{width:100%;height:100%;padding:0}.workbench--desktop-only #desktop-shell{margin:0}.workbench--desktop-only .preview{background:rgb(0 0 0)}@media(max-width:800px){header label{display:none}main{grid-template-columns:1fr;grid-template-rows:minmax(300px,55%) 1fr}.preview{padding:0 12px 12px}aside{border-left:0;border-top:1px solid var(--line)}}
/* Scenario Studio task workflow */
main{grid-template-columns:minmax(0,1fr) 5px var(--panel-width)}
header>strong{margin-right:0}header #input-name{margin-right:auto}#studio-state{display:inline-flex;align-items:center;gap:6px;padding:4px 8px;border:1px solid var(--line);border-radius:999px;font-weight:600}#studio-state:before{content:"";width:7px;height:7px;border-radius:50%;background:rgb(148 158 173)}#studio-state[data-state=live]:before{background:rgb(22 163 74)}#studio-state[data-state=rehearsing]:before{background:var(--accent)}#studio-state[data-state=stale]:before{background:rgb(217 119 6)}#studio-state[data-state=disconnected]:before{background:rgb(220 38 38)}.canvas-switch{display:flex;padding:2px;border:1px solid var(--line);border-radius:7px;background:var(--surface-raised)}.canvas-switch button{border:0;background:transparent}.canvas-switch button[aria-pressed=true]{color:var(--accent);background:var(--surface);box-shadow:0 1px 2px rgb(25 31 42 / 10%)}
#splitter{position:relative;z-index:5;cursor:col-resize;background:var(--line)}#splitter:hover,#splitter:focus-visible{background:var(--accent);outline:0}aside{border-left:0}.tasks{display:grid!important;grid-template-columns:repeat(4,1fr);overflow:visible!important;padding:0 6px!important}.tasks [role=tab]{padding-inline:4px}.subtools{display:flex;gap:3px;padding:10px 12px;border-bottom:1px solid var(--line);background:var(--surface)}.subtools button{flex:1;border-color:transparent;background:transparent;color:var(--muted)}.subtools button[aria-pressed=true]{border-color:var(--line);color:var(--ink);background:var(--surface-raised)}#panel-content{height:calc(100% - 41px);padding:0}.tool-content{padding:16px}.empty-state{display:grid;gap:9px;padding:16px;border:1px dashed rgb(185 194 207);border-radius:8px;background:var(--surface-raised)}.empty-state span{font-size:12px;line-height:1.5;color:var(--muted)}.empty-state button{justify-self:start}.context-heading{display:grid;gap:5px;margin-bottom:14px}.context-heading span{font-size:11px;text-transform:uppercase;letter-spacing:.07em;color:var(--muted)}
#desktop-shell{position:relative}.preview-shield{position:absolute;z-index:4;inset:0;display:grid;place-items:center;background:rgb(22 28 38 / 18%);backdrop-filter:blur(1px)}.preview-shield button{display:grid;gap:4px;padding:12px 16px;border:1px solid rgb(255 255 255 / 70%);border-radius:8px;color:var(--ink);background:rgb(255 255 255 / 94%);box-shadow:0 8px 24px rgb(25 31 42 / 16%)}.preview-shield span{font-size:11px;color:var(--muted)}#desktop-shell:not(.preview-locked) .preview-shield{display:none}#desktop-shell.preview-locked #desktop-frame{pointer-events:none}.preview-active{outline:3px solid var(--accent);outline-offset:2px}
#map-shell{display:none;height:calc(100% - 61px);min-height:0}.workbench--map #desktop-shell{display:none}.workbench--map #map-shell{display:grid;grid-template-rows:auto 1fr}.workbench--map .preview-meta label{visibility:hidden}.map-toolbar{display:flex;align-items:center;gap:12px;padding:9px 10px;border:1px solid var(--line);border-bottom:0;border-radius:7px 7px 0 0;background:var(--surface)}.map-toolbar label{margin:0}.map-toolbar input{width:190px;padding:7px 9px;border:1px solid var(--line);border-radius:6px;font:inherit}.map-toolbar>span{margin-right:auto;font-size:12px;color:var(--muted)}.map-toolbar>div{display:flex;gap:4px}.map-toolbar button{padding:5px 9px;border:1px solid var(--line);border-radius:5px;background:var(--surface)}.map-viewport{min-height:0;overflow:auto;border:1px solid var(--line);border-radius:0 0 7px 7px;background-color:var(--surface);background-image:radial-gradient(rgb(203 210 220) 1px,transparent 1px);background-size:18px 18px;cursor:grab}.map-viewport.is-panning{cursor:grabbing}.map-viewport .story-map{display:block;width:100%;height:100%;min-height:0;transform-origin:top left;transition:transform 120ms ease}.graph-node{cursor:pointer}.graph-node--match rect,.graph-node:focus rect{stroke:var(--accent);stroke-width:3}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.timeline-status{display:grid;gap:3px;margin-bottom:12px}.timeline-status span{font-size:12px;color:var(--muted)}.danger-action{margin-left:auto;color:rgb(185 28 28)!important}.timeline{display:grid;gap:0;margin:18px 0;padding:0;list-style:none}.timeline-step{position:relative;padding-left:24px;border-left:1px solid var(--line)}.timeline-step>button{display:grid;grid-template-columns:12px 1fr auto;align-items:start;gap:8px;width:100%;margin:0;padding:9px;text-align:left;border-color:transparent;background:transparent}.timeline-step>button i{width:8px;height:8px;margin-top:4px;border:2px solid rgb(148 158 173);border-radius:50%;background:var(--surface)}.timeline-step--complete>button i{border-color:rgb(22 163 74);background:rgb(22 163 74)}.timeline-step--current>button{border-color:rgb(191 219 254);background:rgb(239 246 255)}.timeline-step--current>button i{border-color:var(--accent);background:var(--accent);box-shadow:0 0 0 3px rgb(219 234 254)}.timeline-step>button span{display:grid;gap:3px}.timeline-step>button code{color:var(--muted)}.timeline-step>button em{font-size:11px;font-style:normal;color:var(--muted)}.timeline-step>p{margin:0 10px 10px;font-size:11px;color:var(--muted)}.step-changes{display:grid;gap:4px;margin:0 10px 12px;padding:8px;border-radius:5px;background:var(--surface-raised);font-size:11px}.step-changes span{display:block}.step-changes b{display:inline-block;min-width:58px;color:var(--muted)}
.workbench--full main{grid-template-columns:1fr}.workbench--full aside,.workbench--full #splitter{display:none}.workbench--desktop-only #splitter,.workbench--desktop-only #map-shell,.workbench--desktop-only .preview-shield{display:none}@media(max-width:900px){main{grid-template-columns:1fr;grid-template-rows:minmax(300px,55%) 5px 1fr}#splitter{cursor:row-resize}.tasks{border-top:1px solid var(--line)}header #input-name{display:none}.canvas-switch{margin-left:auto}}
.source-actions{display:flex;flex-wrap:wrap;align-items:center;gap:6px}.source-actions a{padding:6px 9px;border:1px solid var(--line);border-radius:5px;color:var(--accent);text-decoration:none;background:var(--surface)}.source-actions span{font-size:11px;color:var(--muted)}.text-action{display:inline!important;width:auto!important;margin:0!important;padding:0!important;border:0!important;color:var(--accent)!important;background:transparent!important;font:inherit!important}.primary-action{border-color:var(--accent)!important;color:rgb(255 255 255)!important;background:var(--accent)!important}details{margin:10px 0;padding:8px;border:1px solid var(--line);border-radius:6px}summary{cursor:pointer;font-size:12px;color:var(--muted)}.event-history{display:grid;gap:6px;margin-top:18px}.event-history h3{margin-bottom:2px}.event-history button{display:grid;grid-template-columns:auto 1fr;gap:8px;text-align:left}.event-history button span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--muted)}.buddy{gap:10px}.buddy-heading{display:flex;justify-content:space-between}.buddy-heading span{font-size:11px;color:var(--muted)}.buddy textarea{resize:vertical}.persona-modes{display:flex;gap:6px}.transcript{display:grid;gap:7px}.transcript>div{padding:9px;border-radius:6px;background:var(--surface)}.transcript p{margin:4px 0;font-size:12px}.provenance{display:inline-block;padding:2px 6px;border-radius:999px;color:rgb(30 64 175);background:rgb(219 234 254);font-size:10px;font-weight:700;text-transform:uppercase}.ship-summary{display:grid;gap:7px}.ship-summary>div:first-child{display:flex;justify-content:space-between}.ship-summary span,.ship-summary small{color:var(--muted)}.budget{height:8px;overflow:hidden;border-radius:999px;background:rgb(229 231 235)}.budget i{display:block;height:100%;background:var(--accent)}.ship-ready,.ship-blockers{display:grid;gap:4px;margin:16px 0;padding:12px;border-radius:6px}.ship-ready{color:rgb(21 128 61);background:rgb(240 253 244)}.ship-blockers{color:rgb(185 28 28);background:rgb(254 242 242)}.asset-heading{display:flex;align-items:center;justify-content:space-between;margin-top:18px}.asset-heading span{font-size:11px;color:var(--muted)}.asset{grid-template-columns:20px minmax(80px,1fr) minmax(100px,1.5fr) auto}.asset>b{color:var(--muted)}.asset>span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--muted)}
</style></head>
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
    const attemptedAt = new Date().toISOString();
    snapshot = {
      ...snapshot,
      reload: { ...snapshot.reload, status: 'reloading', attemptedAt },
    };
    broadcastSnapshot();
    try {
      const candidate = await loadInput(currentInput.file);
      const candidateSnapshot = await buildAuthoringSnapshot(candidate, ++revision, {
        status: 'current',
        lastValidAt: attemptedAt,
        attemptedAt,
      });
      const result = candidateSnapshot.lint.result;
      output.write(
        `\n[reload] ${path.basename(currentInput.file)}: ${result?.ok ? 'valid' : 'invalid'} (${result?.diagnostics.length ?? 0} diagnostic(s))\n`
      );
      result?.diagnostics.forEach(item =>
        output.write(`  ${item.level.toUpperCase()} [${item.code}]: ${item.message}\n`)
      );
      if (!result?.ok) {
        snapshot = {
          ...candidateSnapshot,
          runtime: snapshot.runtime,
          recentEvents: snapshot.recentEvents,
          reload: {
            status: 'stale',
            lastValidAt: snapshot.reload.lastValidAt,
            attemptedAt,
            error: 'The changed draft failed lint; previewing the last valid draft.',
          },
        };
        broadcastSnapshot();
        return;
      }
      currentInput = candidate;
      completion = completionFor(currentInput);
      snapshot = {
        ...candidateSnapshot,
        runtime: snapshot.runtime,
        recentEvents: snapshot.recentEvents,
      };
      const browserModule = vite.moduleGraph.getModuleById(resolvedClientId);
      if (browserModule) vite.moduleGraph.invalidateModule(browserModule);
      broadcastSnapshot();
      vite.ws.send({ type: 'full-reload' });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      snapshot = {
        ...snapshot,
        revision: ++revision,
        reload: {
          status: 'stale',
          lastValidAt: snapshot.reload.lastValidAt,
          attemptedAt,
          error: message,
        },
      };
      broadcastSnapshot();
      output.write(`\n[reload] ${message}\n`);
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
