export interface BrowserClientOptions {
  engineModule: string;
  scenarioModule: string;
  controlUrl: string;
  storagePrefix: string;
  language: string;
}

const literal = (value: string): string => JSON.stringify(value);

/** Build the virtual Vite entry that mounts the authored scenario and its control bridge. */
export const buildBrowserClientSource = (options: BrowserClientOptions): string => `
import React from 'react';
import { createRoot } from 'react-dom/client';
import { WindowsXP, compilePuzzleGraph } from ${literal(options.engineModule)};
import * as authoredModule from ${literal(options.scenarioModule)};

const isObject = value => typeof value === 'object' && value !== null && !Array.isArray(value);
const kindOf = value => {
  if (!isObject(value)) return null;
  if (Array.isArray(value.puzzles)) return 'graph';
  if (Array.isArray(value.triggers)) return 'scenario';
  if (typeof value.id === 'string' && ['assets', 'sites', 'files', 'scenario'].some(key => key in value)) return 'pack';
  return null;
};
const authored = [authoredModule.default, ...Object.values(authoredModule)].find(value => kindOf(value));
if (!authored) throw new Error('Scenario module has no scenario, puzzle graph, or content pack export');
const authoredKind = kindOf(authored);
const scenario = authoredKind === 'graph' ? compilePuzzleGraph(authored) : authoredKind === 'pack' ? authored.scenario : authored;
if (!scenario) throw new Error('Content pack has no scenario');
const contentPacks = authoredKind === 'pack' ? [authored] : undefined;
const controlUrl = ${literal(options.controlUrl)};

let activeSocket = null;
let suppressEventStream = 0;
const send = message => {
  if (activeSocket?.readyState === WebSocket.OPEN) activeSocket.send(JSON.stringify(message));
};
const withoutEventStream = callback => {
  suppressEventStream += 1;
  try {
    return callback();
  } finally {
    suppressEventStream -= 1;
  }
};

function AuthoringDesktop() {
  const xp = React.useRef(null);

  React.useEffect(() => {
    let stopped = false;
    let retry = 0;
    let socket = null;
    const connect = () => {
      if (stopped) return;
      socket = new WebSocket(controlUrl);
      activeSocket = socket;
      socket.addEventListener('open', () => {
        retry = 0;
        const rehearsal = xp.current?.scenario.getState();
        send({
          type: 'ready',
          scenarioId: scenario.id,
          triggerCount: scenario.triggers.length,
          beats: rehearsal?.beats.map(item => item.beat) ?? [],
        });
      });
      socket.addEventListener('message', async event => {
        let request;
        try {
          request = JSON.parse(String(event.data));
          if (request?.type !== 'command' || typeof request.id !== 'string') return;
          const handle = xp.current;
          if (!handle) throw new Error('desktop imperative API is not ready');
          const command = request.command;
          let data;
          if (command.type === 'seek') {
            const found = withoutEventStream(() => handle.scenario.seekTo(command.beat));
            if (!found) throw new Error('unknown rehearsal beat: ' + command.beat);
            data = handle.scenario.getState();
          } else if (command.type === 'step') {
            withoutEventStream(() => {
              if (command.direction === 'back') handle.scenario.stepBack();
              else handle.scenario.stepForward();
            });
            data = handle.scenario.getState();
          } else if (command.type === 'exit-rehearsal') {
            withoutEventStream(() => handle.scenario.exitRehearsal());
            data = handle.scenario.getState();
          } else if (command.type === 'flags') {
            data = handle.scenario.getDebugState().flags;
          } else if (command.type === 'flag-set') {
            if (!handle.scenario.setFlag(command.flag, command.value)) throw new Error('no runnable scenario');
            data = handle.scenario.getDebugState().flags;
          } else if (command.type === 'status') {
            data = handle.scenario.getDebugState();
          } else if (command.type === 'emit') {
            handle.emit(command.event);
            data = handle.scenario.getDebugState();
            } else if (command.type === 'chat') {
              handle.qq.ensureProfile();
              if (!handle.qq.hasBuddy(command.buddy) && command.profile) {
                handle.qq.loadProfile(command.profile);
              }
              const windowId = handle.qq.open(command.buddy);
            if (!windowId) throw new Error('unknown QQ buddy: ' + command.buddy);
            for (let attempt = 0; attempt < 20 && !handle.qq.hasBuddy(command.buddy); attempt += 1) {
              await new Promise(resolve => setTimeout(resolve, 50));
            }
            if (!handle.qq.sendMessage(command.buddy, command.text)) throw new Error('QQ buddy profile did not load: ' + command.buddy);
            data = { buddy: command.buddy, text: command.text, windowId };
          } else if (command.type === 'reset') {
            data = { resetting: true };
            send({ type: 'response', id: request.id, ok: true, data });
            setTimeout(() => handle.reset(), 0);
            return;
          } else {
            throw new Error('unknown browser command');
          }
          send({ type: 'response', id: request.id, ok: true, data });
        } catch (error) {
          if (request?.id) {
            send({ type: 'response', id: request.id, ok: false, error: error instanceof Error ? error.message : String(error) });
          }
        }
      });
      socket.addEventListener('close', () => {
        if (activeSocket === socket) activeSocket = null;
        if (!stopped) setTimeout(connect, Math.min(250 * 2 ** retry++, 3000));
      });
    };
    connect();
    return () => {
      stopped = true;
      socket?.close();
      if (activeSocket === socket) activeSocket = null;
    };
  }, []);

  const onEvent = React.useCallback(event => {
    if (suppressEventStream === 0) send({ type: 'event', event });
  }, []);
  return React.createElement(WindowsXP, {
    ref: xp,
    scenario,
    contentPacks,
    autoLogin: true,
    skipBoot: true,
    storagePrefix: ${literal(options.storagePrefix)},
    language: ${literal(options.language)},
    onEvent,
  });
}

createRoot(document.getElementById('root')).render(React.createElement(AuthoringDesktop));
`;
