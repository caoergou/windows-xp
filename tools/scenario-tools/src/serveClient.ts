import { KNOWN_EVENT_TYPES } from './eventTypes';

export interface BrowserClientOptions {
  engineModule: string;
  scenarioModule?: string;
  authoredValue?: unknown;
  controlUrl: string;
  storagePrefix: string;
  language: string;
  workbench?: boolean;
}

const literal = (value: string): string => JSON.stringify(value);

/** Build the virtual Vite entry that mounts the authored scenario and its control bridge. */
export const buildBrowserClientSource = (options: BrowserClientOptions): string => `
import React from 'react';
import { createRoot } from 'react-dom/client';
import { WindowsXP, compilePuzzleGraph } from ${literal(options.engineModule)};
${options.authoredValue === undefined ? `import * as authoredModule from ${literal(options.scenarioModule ?? '')};` : ''}

const isObject = value => typeof value === 'object' && value !== null && !Array.isArray(value);
const kindOf = value => {
  if (!isObject(value)) return null;
  if (Array.isArray(value.puzzles)) return 'graph';
  if (Array.isArray(value.triggers)) return 'scenario';
  if (typeof value.id === 'string' && ['assets', 'sites', 'files', 'scenario'].some(key => key in value)) return 'pack';
  return null;
};
const authored = ${
  options.authoredValue === undefined
    ? '[authoredModule.default, ...Object.values(authoredModule)].find(value => kindOf(value))'
    : `JSON.parse(${literal(JSON.stringify(options.authoredValue))})`
};
if (!authored) throw new Error('Scenario module has no scenario, puzzle graph, or content pack export');
const authoredKind = kindOf(authored);
const scenario = authoredKind === 'graph' ? compilePuzzleGraph(authored) : authoredKind === 'pack' ? authored.scenario : authored;
if (!scenario) throw new Error('Content pack has no scenario');
const contentPacks = authoredKind === 'pack' ? [authored] : undefined;
const controlUrl = ${literal(options.controlUrl)};
const isPreviewFrame = window.location.pathname === '/preview';

let activeSocket = null;
let suppressEventStream = 0;
let requestSequence = 0;
let currentSnapshot = null;
let selectedNodeId = null;
const send = message => {
  if (activeSocket?.readyState === WebSocket.OPEN) activeSocket.send(JSON.stringify(message));
};

const escapeHtml = value => String(value ?? '')
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;');
const command = value => {
  const id = 'ui-' + ++requestSequence;
  const message = { type: 'authoring-command', id, protocolVersion: 1, command: value };
  if (isPreviewFrame) send(message);
  else document.querySelector('#desktop-frame')?.contentWindow?.postMessage({ type: 'studio-command', message }, window.location.origin);
};
const gate = value => '<span class="gate gate--' + value.status + '">' + value.status + '</span>';
const renderGraph = graph => {
  const width = 520;
  const row = 74;
  const height = Math.max(120, graph.nodes.length * row);
  const positions = new Map(graph.nodes.map((node, index) => [node.id, { x: node.kind === 'asset' ? 340 : 28, y: 22 + index * row }]));
  const edges = graph.edges.map(edge => {
    const from = positions.get(edge.from); const to = positions.get(edge.to);
    if (!from || !to) return '';
    return '<path d="M ' + (from.x + 140) + ' ' + (from.y + 18) + ' L ' + to.x + ' ' + (to.y + 18) + '" class="graph-edge graph-edge--' + edge.kind + '"/><text x="' + ((from.x + to.x + 140) / 2) + '" y="' + ((from.y + to.y) / 2 + 12) + '">' + escapeHtml(edge.label ?? '') + '</text>';
  }).join('');
  const nodes = graph.nodes.map(node => {
    const point = positions.get(node.id);
    return '<g class="graph-node" data-node="' + escapeHtml(node.id) + '" tabindex="0" role="button"><rect x="' + point.x + '" y="' + point.y + '" width="140" height="36" rx="5"/><text x="' + (point.x + 8) + '" y="' + (point.y + 22) + '">' + escapeHtml(node.label) + '</text></g>';
  }).join('');
  return '<p>Bushiness: ' + escapeHtml(graph.bushiness?.join(' → ') ?? 'n/a') + ' · max parallel: ' + escapeHtml(graph.maxParallel ?? 'n/a') + '</p><svg class="story-map" viewBox="0 0 ' + width + ' ' + height + '" aria-label="Story dependency map">' + edges + nodes + '</svg><section id="node-detail" aria-live="polite"></section>';
};
const selectGraphNode = id => {
  selectedNodeId = id;
  const node = currentSnapshot?.graph.nodes.find(item => item.id === id);
  const detail = document.querySelector('#node-detail');
  if (!node || !detail) return;
  const edges = currentSnapshot.graph.edges.filter(edge => edge.from === id || edge.to === id);
  const key = node.label.replace(/^.*:/, '');
  const diagnostics = (currentSnapshot.lint.result?.diagnostics ?? []).filter(item =>
    (item.path ?? '').includes(key) || item.message.includes(key)
  );
  const beat = currentSnapshot.beats.find(item => item.beat === node.label || item.beat === key);
  detail.innerHTML = '<h3>' + escapeHtml(node.label) + '</h3><p>' + escapeHtml(node.kind) + ' · ' + edges.length + ' connected edge(s) · ' + diagnostics.length + ' diagnostic(s)</p>' + (beat ? '<button data-node-seek="' + escapeHtml(beat.beat) + '">Seek here</button>' : '') + '<button data-node-inspect>Why did this not fire?</button>';
  detail.querySelector('[data-node-seek]')?.addEventListener('click', event => command({ type: 'seek', beat: event.currentTarget.dataset.nodeSeek }));
  detail.querySelector('[data-node-inspect]')?.addEventListener('click', () => {
    const tab = document.querySelector('[data-panel="inspector"]');
    tab?.click();
  });
};
const panelContent = (name, snapshot) => {
  if (name === 'problems') {
    const items = snapshot.lint.result?.diagnostics ?? [];
    return '<div class="gate-row">Lint ' + gate(snapshot.lint) + ' Solve ' + gate(snapshot.solve) + ' Pack ' + gate(snapshot.pack) + '</div>' + (items.length ? items.map(item => '<article class="diagnostic diagnostic--' + item.level + '"><strong>' + escapeHtml(item.code) + '</strong><span>' + escapeHtml(item.message) + '</span><code>' + escapeHtml(item.path ?? '') + '</code>' + (item.help ? '<small>' + escapeHtml(item.help) + '</small>' : '') + '</article>').join('') : '<p>No lint diagnostics.</p>');
  }
  if (name === 'map') return renderGraph(snapshot.graph);
  if (name === 'timeline') return '<div class="toolbar"><button data-command="step-back">← Step</button><button data-command="step-forward">Step →</button><button data-command="exit">Exit rehearsal</button><button data-command="reset">Reset</button></div><ol class="timeline">' + snapshot.beats.map(item => '<li><button data-seek="' + escapeHtml(item.beat ?? '') + '" ' + (item.beat ? '' : 'disabled') + '><span>' + escapeHtml(item.beat ?? 'unnamed') + '</span><code>' + escapeHtml(item.event.type) + '</code></button></li>').join('') + '</ol><p class="notice">Rehearsal collapses delayed actions; non-filesystem UI state is not reconstructed pixel-exactly.</p>';
  if (name === 'inspector') {
    const key = selectedNodeId?.replace(/^.*:/, '');
    const triggers = key ? (snapshot.runtime?.triggers ?? []).filter(item => item.id === key || item.id?.includes(key)) : snapshot.runtime?.triggers;
    return (selectedNodeId ? '<p>Selected graph node: <code>' + escapeHtml(selectedNodeId) + '</code></p>' : '') + '<h3>Trigger conditions</h3><pre>' + escapeHtml(JSON.stringify(triggers ?? { waiting: 'desktop status' }, null, 2)) + '</pre><h3>Recent events</h3><pre>' + escapeHtml(JSON.stringify(snapshot.recentEvents, null, 2)) + '</pre>';
  }
  if (name === 'events') return '<label>Event type<select id="event-type">' + ${JSON.stringify([...KNOWN_EVENT_TYPES])}.map(value => '<option>' + escapeHtml(value) + '</option>').join('') + '</select></label><label>Payload fields (JSON)<textarea id="event-payload" rows="7">{}</textarea></label><button data-command="emit">Inject event</button><hr><label>Flag<select id="flag-name">' + snapshot.flags.map(value => '<option>' + escapeHtml(value) + '</option>').join('') + '</select></label><label>Temporary value (JSON)<input id="flag-value" value="true"></label><button data-command="flag">Override flag</button>';
  if (name === 'personas') return snapshot.buddies.length ? snapshot.buddies.map(item => '<article class="buddy"><strong>' + escapeHtml(item.id) + '</strong><span>fallback ' + (item.hasFallback ? 'available' : 'missing') + '</span><div><button data-chat="mock" data-buddy="' + escapeHtml(item.id) + '">Mock</button><button data-chat="offline" data-buddy="' + escapeHtml(item.id) + '" ' + (item.hasFallback ? '' : 'disabled') + '>Offline</button><button data-chat="provider" data-buddy="' + escapeHtml(item.id) + '" ' + (item.hasProvider ? '' : 'disabled') + '>Provider</button></div></article>').join('') : '<p>No authored buddies.</p>';
  const report = snapshot.pack.result;
  return report ? '<dl class="shipping"><dt>Logic</dt><dd>' + report.logicBytes + ' B</dd><dt>Scenario</dt><dd>' + report.scenarioBytes + ' / ' + report.scenarioLimitBytes + ' B</dd><dt>Assets</dt><dd>' + report.assetBytes + ' B</dd><dt>Packed total</dt><dd>' + report.totalBytes + ' B</dd></dl><h3>Assets</h3>' + report.assets.map(item => '<div class="asset"><code>' + escapeHtml(item.key) + '</code><span>' + escapeHtml(item.source) + '</span><span>' + escapeHtml(item.bytes ?? 'remote') + '</span></div>').join('') : '<p>Shipping report is only available for content packs.</p>';
};
const bindPanel = () => {
  document.querySelectorAll('[data-command]').forEach(button => button.addEventListener('click', () => {
    const action = button.dataset.command;
    if (action === 'step-back') command({ type: 'step', direction: 'back' });
    else if (action === 'step-forward') command({ type: 'step', direction: 'forward' });
    else if (action === 'exit') command({ type: 'exit-rehearsal' });
    else if (action === 'reset') command({ type: 'reset' });
    else if (action === 'emit') {
      try { command({ type: 'emit', event: { type: document.querySelector('#event-type').value, ...JSON.parse(document.querySelector('#event-payload').value) } }); }
      catch (error) { showToast(error.message, true); }
    } else if (action === 'flag') {
      try { command({ type: 'flag-set', flag: document.querySelector('#flag-name').value, value: JSON.parse(document.querySelector('#flag-value').value) }); }
      catch (error) { showToast(error.message, true); }
    }
  }));
  document.querySelectorAll('[data-seek]').forEach(button => button.addEventListener('click', () => command({ type: 'seek', beat: button.dataset.seek })));
  document.querySelectorAll('[data-chat]').forEach(button => button.addEventListener('click', () => command({ type: 'chat-rehearse', buddy: button.dataset.buddy, message: 'Hello', mode: button.dataset.chat })));
  document.querySelectorAll('[data-node]').forEach(node => {
    const select = () => selectGraphNode(node.dataset.node);
    node.addEventListener('click', select);
    node.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); select(); }
    });
  });
  if (selectedNodeId && document.querySelector('#node-detail')) selectGraphNode(selectedNodeId);
};
const renderWorkbench = snapshot => {
  currentSnapshot = snapshot;
  const stale = snapshot.reload.status === 'stale';
  document.querySelector('#input-name').textContent = snapshot.input.id;
  document.querySelector('#reload-state').textContent = stale ? 'Stale preview · last valid draft' : 'Draft current';
  document.querySelector('#reload-state').className = stale ? 'stale' : '';
  const active = document.querySelector('[role="tab"][aria-selected="true"]')?.dataset.panel ?? 'problems';
  document.querySelector('#panel-content').innerHTML = panelContent(active, snapshot);
  bindPanel();
};
const showToast = (message, error = false) => {
  const toast = document.querySelector('#toast'); toast.textContent = message;
  toast.className = error ? 'toast toast--error' : 'toast';
  setTimeout(() => { toast.textContent = ''; }, 3500);
};
const setupWorkbench = () => {
  document.querySelector('#root').innerHTML = '<div class="workbench"><header><strong>Scenario Studio</strong><span id="input-name">Untitled scenario</span><span id="connection-state">Connecting…</span><span id="reload-state"></span><label>Panel width <input id="split-size" type="range" min="320" max="720" value="440"></label><button id="preview-lock">Enable preview interaction</button><button id="full-preview">Full preview</button></header><main><section class="preview"><div class="preview-meta"><strong>Preview</strong><label>Viewport <select id="viewport"><option value="100%">Responsive</option><option value="1024px">1024 × 768</option><option value="1280px">1280 × 720</option></select></label></div><div id="desktop-shell" inert><iframe id="desktop-frame" src="/preview" title="Windows XP scenario preview"></iframe></div></section><aside><nav role="tablist">' + ['problems','map','timeline','inspector','events','personas','shipping'].map((name, index) => '<button role="tab" data-panel="' + name + '" aria-selected="' + (index === 0) + '">' + name + '</button>').join('') + '</nav><div id="panel-content"></div></aside></main><div id="toast" class="toast" aria-live="polite"></div></div>';
  if (${options.workbench === false ? 'true' : 'false'}) {
    document.querySelector('.workbench').classList.add('workbench--desktop-only');
    document.querySelector('#desktop-shell').removeAttribute('inert');
  }
  document.querySelectorAll('[role="tab"]').forEach(tab => tab.addEventListener('click', () => {
    document.querySelectorAll('[role="tab"]').forEach(item => item.setAttribute('aria-selected', String(item === tab)));
    if (currentSnapshot) { document.querySelector('#panel-content').innerHTML = panelContent(tab.dataset.panel, currentSnapshot); bindPanel(); }
  }));
  document.querySelector('#split-size').addEventListener('input', event => document.documentElement.style.setProperty('--panel-width', event.target.value + 'px'));
  document.querySelector('#viewport').addEventListener('change', event => { document.querySelector('#desktop-shell').style.width = event.target.value; });
  document.querySelector('#preview-lock').addEventListener('click', event => {
    const shell = document.querySelector('#desktop-shell'); const locked = shell.hasAttribute('inert');
    if (locked) shell.removeAttribute('inert'); else shell.setAttribute('inert', '');
    event.target.textContent = locked ? 'Lock preview focus' : 'Enable preview interaction';
  });
  document.querySelector('#full-preview').addEventListener('click', () => document.querySelector('.workbench').classList.toggle('workbench--full'));
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
        if (isPreviewFrame) window.parent.postMessage({ type: 'studio-connection', state: 'Connected' }, window.location.origin);
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
          if (request?.type === 'snapshot') { window.parent.postMessage({ type: 'studio-snapshot', snapshot: request.snapshot }, window.location.origin); return; }
          if (request?.type === 'authoring-result') { window.parent.postMessage({ type: 'studio-result', result: request }, window.location.origin); return; }
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
        if (isPreviewFrame) window.parent.postMessage({ type: 'studio-connection', state: 'Disconnected · retrying' }, window.location.origin);
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

if (isPreviewFrame) {
  document.querySelector('#root').innerHTML = '<div id="desktop-root"></div>';
  window.addEventListener('message', event => {
    if (event.origin === window.location.origin && event.data?.type === 'studio-command') send(event.data.message);
  });
  createRoot(document.getElementById('desktop-root')).render(React.createElement(AuthoringDesktop));
} else {
  setupWorkbench();
  window.addEventListener('message', event => {
    if (event.origin !== window.location.origin) return;
    if (event.data?.type === 'studio-snapshot') renderWorkbench(event.data.snapshot);
    else if (event.data?.type === 'studio-result') showToast(event.data.result.ok ? 'Command completed' : event.data.result.error, !event.data.result.ok);
    else if (event.data?.type === 'studio-connection') document.querySelector('#connection-state').textContent = event.data.state;
  });
}
`;
