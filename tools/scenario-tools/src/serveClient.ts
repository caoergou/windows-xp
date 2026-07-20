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
let activeTask = 'build';
let activeTool = 'problems';
let canvasMode = 'preview';
let connectionState = 'connecting';
let previewReturnTarget = null;
let mapZoom = 1;
const TASK_TOOLS = {
  build: [['problems', 'Problems'], ['map', 'Story map']],
  rehearse: [['timeline', 'Timeline'], ['events', 'Events'], ['personas', 'Personas']],
  inspect: [['inspector', 'Runtime']],
  ship: [['shipping', 'Shipping']],
};
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
  const columns = graph.nodes.length > 8 ? 3 : graph.nodes.length > 4 ? 2 : 1;
  const columnWidth = 210;
  const rowHeight = 92;
  const width = Math.max(520, columns * columnWidth + 60);
  const height = Math.max(240, Math.ceil(graph.nodes.length / columns) * rowHeight + 60);
  const positions = new Map(graph.nodes.map((node, index) => [node.id, { x: 30 + (index % columns) * columnWidth, y: 30 + Math.floor(index / columns) * rowHeight }]));
  const edges = graph.edges.map(edge => {
    const from = positions.get(edge.from); const to = positions.get(edge.to);
    if (!from || !to) return '';
    return '<path d="M ' + (from.x + 140) + ' ' + (from.y + 18) + ' L ' + to.x + ' ' + (to.y + 18) + '" class="graph-edge graph-edge--' + edge.kind + '"/><text x="' + ((from.x + to.x + 140) / 2) + '" y="' + ((from.y + to.y) / 2 + 12) + '">' + escapeHtml(edge.label ?? '') + '</text>';
  }).join('');
  const nodes = graph.nodes.map(node => {
    const point = positions.get(node.id);
    return '<g class="graph-node" data-node="' + escapeHtml(node.id) + '" tabindex="0" role="button"><rect x="' + point.x + '" y="' + point.y + '" width="140" height="36" rx="5"/><text x="' + (point.x + 8) + '" y="' + (point.y + 22) + '">' + escapeHtml(node.label) + '</text></g>';
  }).join('');
  const pacing = graph.bushiness ? 'Bushiness ' + escapeHtml(graph.bushiness.join(' → ')) + ' · max parallel ' + escapeHtml(graph.maxParallel ?? 'n/a') : graph.nodes.length + ' nodes · ' + graph.edges.length + ' connections';
  return '<div class="map-toolbar"><label><span class="sr-only">Search story map</span><input id="map-search" type="search" placeholder="Find a node…"></label><span>' + pacing + '</span><div><button data-map-action="zoom-out" aria-label="Zoom out">−</button><button data-map-action="fit">Fit</button><button data-map-action="zoom-in" aria-label="Zoom in">+</button></div></div><div class="map-viewport"><svg class="story-map" viewBox="0 0 ' + width + ' ' + height + '" aria-label="Story dependency map">' + edges + nodes + '</svg></div>';
};
const selectGraphNode = id => {
  selectedNodeId = id;
  const node = currentSnapshot?.graph.nodes.find(item => item.id === id);
  const detail = document.querySelector('#selection-detail');
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
const actionSummary = action => {
  const key = Object.keys(action ?? {})[0];
  if (!key) return 'side effect';
  const value = action[key];
  if (Array.isArray(value)) return key + ' ' + value.join('/');
  if (isObject(value) && Array.isArray(value.path)) return key + ' ' + value.path.join('/');
  if (typeof value === 'string') return key + ' ' + value;
  return key;
};
const timelineContent = snapshot => {
  const rehearsal = snapshot.runtime?.rehearsal;
  const current = rehearsal?.active ? rehearsal.index + 1 : 0;
  const solveSteps = snapshot.solve.result?.steps ?? [];
  const rows = snapshot.beats.map((item, index) => {
    const step = solveSteps[index];
    const position = index + 1;
    const state = rehearsal?.active ? (position < current ? 'complete' : position === current ? 'current' : 'upcoming') : 'idle';
    const changes = [
      ...(step?.fired ?? []).map(value => '<span><b>Triggered</b> ' + escapeHtml(value) + '</span>'),
      ...(step?.flagChanges ?? []).map(value => '<span><b>Flag</b> ' + escapeHtml(value.flag) + ': ' + escapeHtml(JSON.stringify(value.before)) + ' → ' + escapeHtml(JSON.stringify(value.after)) + '</span>'),
      ...(step?.actions ?? []).map(value => '<span><b>Action</b> ' + escapeHtml(actionSummary(value)) + '</span>'),
    ];
    return '<li class="timeline-step timeline-step--' + state + '"><button data-seek="' + escapeHtml(item.beat ?? '') + '" ' + (item.beat ? '' : 'disabled') + '><i aria-hidden="true"></i><span><strong>' + escapeHtml(item.beat ?? 'Unnamed step') + '</strong><code>' + escapeHtml(item.event.type) + '</code></span><em>' + position + '</em></button>' + (changes.length ? '<div class="step-changes">' + changes.join('') + '</div>' : '<p>No authored state change at this step.</p>') + '</li>';
  }).join('');
  const positionLabel = rehearsal?.active ? 'Rehearsing · ' + Math.max(0, current) + '/' + rehearsal.length : 'Not rehearsing';
  return '<div class="timeline-status"><strong>' + positionLabel + '</strong><span>Seek or step through the canonical tape</span></div><div class="toolbar"><button data-command="step-back">← Step</button><button data-command="step-forward">Step →</button><button data-command="exit">Exit rehearsal</button><button class="danger-action" data-command="reset">Reset desktop</button></div><ol class="timeline">' + rows + '</ol><p class="notice">Delayed actions collapse during rehearsal; non-filesystem UI state is not reconstructed pixel-exactly.</p>';
};
const toolContent = (name, snapshot) => {
  if (name === 'problems') {
    const items = snapshot.lint.result?.diagnostics ?? [];
    return '<div class="gate-row">Lint ' + gate(snapshot.lint) + ' Solve ' + gate(snapshot.solve) + ' Pack ' + gate(snapshot.pack) + '</div>' + (items.length ? items.map(item => '<article class="diagnostic diagnostic--' + item.level + '"><strong>' + escapeHtml(item.code) + '</strong><span>' + escapeHtml(item.message) + '</span><code>' + escapeHtml(item.path ?? '') + '</code>' + (item.help ? '<small>' + escapeHtml(item.help) + '</small>' : '') + '</article>').join('') : '<div class="empty-state"><strong>The draft is structurally clean.</strong><span>Open Story map to inspect pacing and dependencies, or move to Rehearse to verify the player path.</span><button data-open-tool="map">Open Story map</button></div>');
  }
  if (name === 'map') return '<div class="context-heading"><span>Selected node</span><strong>' + escapeHtml(selectedNodeId ?? 'None') + '</strong></div><section id="selection-detail" aria-live="polite"><p class="notice">Select a node in the map to inspect its dependencies and rehearsal link.</p></section>';
  if (name === 'timeline') return timelineContent(snapshot);
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
const taskContent = snapshot => {
  const tools = TASK_TOOLS[activeTask];
  const navigation = tools.length > 1 ? '<nav class="subtools" aria-label="' + escapeHtml(activeTask) + ' tools">' + tools.map(([id, label]) => '<button data-tool="' + id + '" aria-pressed="' + (id === activeTool) + '">' + label + '</button>').join('') + '</nav>' : '';
  return navigation + '<div class="tool-content">' + toolContent(activeTool, snapshot) + '</div>';
};
const applyMapZoom = () => {
  const map = document.querySelector('.story-map');
  if (map) map.style.transform = 'scale(' + mapZoom + ')';
};
const bindMap = () => {
  applyMapZoom();
  document.querySelectorAll('[data-map-action]').forEach(button => button.addEventListener('click', () => {
    if (button.dataset.mapAction === 'fit') mapZoom = 1;
    else mapZoom = Math.min(2.5, Math.max(.5, mapZoom + (button.dataset.mapAction === 'zoom-in' ? .2 : -.2)));
    applyMapZoom();
    if (button.dataset.mapAction === 'fit') { const viewport = document.querySelector('.map-viewport'); viewport.scrollLeft = 0; viewport.scrollTop = 0; }
  }));
  document.querySelector('#map-search')?.addEventListener('input', event => {
    const query = event.target.value.trim().toLowerCase();
    document.querySelectorAll('[data-node]').forEach(node => node.classList.toggle('graph-node--match', Boolean(query) && node.dataset.node.toLowerCase().includes(query)));
  });
  const viewport = document.querySelector('.map-viewport');
  viewport?.addEventListener('pointerdown', event => {
    if (event.target.closest('[data-node],button,input')) return;
    const startX = event.clientX; const startY = event.clientY;
    const left = viewport.scrollLeft; const top = viewport.scrollTop;
    viewport.classList.add('is-panning'); viewport.setPointerCapture(event.pointerId);
    const move = next => { viewport.scrollLeft = left - (next.clientX - startX); viewport.scrollTop = top - (next.clientY - startY); };
    const stop = () => { viewport.classList.remove('is-panning'); viewport.removeEventListener('pointermove', move); viewport.removeEventListener('pointerup', stop); };
    viewport.addEventListener('pointermove', move); viewport.addEventListener('pointerup', stop);
  });
};
const renderStudio = () => {
  if (!currentSnapshot) return;
  document.querySelectorAll('[data-task]').forEach(item => item.setAttribute('aria-selected', String(item.dataset.task === activeTask)));
  document.querySelectorAll('[data-canvas]').forEach(item => item.setAttribute('aria-pressed', String(item.dataset.canvas === canvasMode)));
  document.querySelector('.workbench').classList.toggle('workbench--map', canvasMode === 'map');
  document.querySelector('#canvas-title').textContent = canvasMode === 'map' ? 'Story map' : 'Preview';
  document.querySelector('#panel-content').innerHTML = taskContent(currentSnapshot);
  document.querySelector('#map-shell').innerHTML = renderGraph(currentSnapshot.graph);
  bindPanel(); bindMap();
  if (selectedNodeId && activeTool === 'map') selectGraphNode(selectedNodeId);
};
const selectTool = tool => {
  const task = Object.entries(TASK_TOOLS).find(([, tools]) => tools.some(([id]) => id === tool));
  if (!task) return;
  activeTask = task[0]; activeTool = tool;
  canvasMode = tool === 'map' ? 'map' : 'preview';
  renderStudio();
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
  document.querySelectorAll('[data-tool]').forEach(button => button.addEventListener('click', () => selectTool(button.dataset.tool)));
  document.querySelectorAll('[data-open-tool]').forEach(button => button.addEventListener('click', () => selectTool(button.dataset.openTool)));
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
  const rehearsal = snapshot.runtime?.rehearsal;
  const state = connectionState === 'disconnected' ? 'disconnected' : stale ? 'stale' : rehearsal?.active ? 'rehearsing' : 'live';
  const label = state === 'rehearsing' ? 'Rehearsing · ' + (rehearsal.index + 1) + '/' + rehearsal.length : state === 'stale' ? 'Stale · last valid draft' : state === 'disconnected' ? 'Disconnected' : 'Live';
  const indicator = document.querySelector('#studio-state');
  indicator.textContent = label; indicator.dataset.state = state;
  renderStudio();
};
const showToast = (message, error = false) => {
  const toast = document.querySelector('#toast'); toast.textContent = message;
  toast.className = error ? 'toast toast--error' : 'toast';
  setTimeout(() => { toast.textContent = ''; }, 3500);
};
const setupWorkbench = () => {
  document.querySelector('#root').innerHTML = '<div class="workbench"><header><strong>Scenario Studio</strong><span id="input-name">Untitled scenario</span><span id="studio-state" data-state="connecting">Connecting</span><div class="canvas-switch" aria-label="Primary canvas"><button data-canvas="preview" aria-pressed="true">Preview</button><button data-canvas="map" aria-pressed="false">Map</button></div><button id="full-preview">Full preview</button></header><main><section class="preview"><div class="preview-meta"><strong id="canvas-title">Preview</strong><label>Viewport <select id="viewport"><option value="100%">Responsive</option><option value="1024px">1024 × 768</option><option value="1280px">1280 × 720</option></select></label></div><div id="desktop-shell" class="preview-locked"><iframe id="desktop-frame" src="/preview" title="Windows XP scenario preview" tabindex="-1"></iframe><div class="preview-shield"><button id="enter-preview"><strong>Click to interact</strong><span>Studio keeps keyboard focus until you enter the XP preview.</span></button></div></div><div id="map-shell"></div></section><div id="splitter" role="separator" aria-label="Resize inspector" aria-orientation="vertical" tabindex="0"></div><aside><nav class="tasks" role="tablist" aria-label="Authoring tasks">' + [['build','Build'],['rehearse','Rehearse'],['inspect','Inspect'],['ship','Ship']].map(([id,label], index) => '<button role="tab" data-task="' + id + '" aria-selected="' + (index === 0) + '">' + label + '</button>').join('') + '</nav><div id="panel-content"></div></aside></main><div id="toast" class="toast" aria-live="polite"></div></div>';
  if (${options.workbench === false ? 'true' : 'false'}) {
    document.querySelector('.workbench').classList.add('workbench--desktop-only');
    document.querySelector('#desktop-shell').classList.remove('preview-locked');
  }
  document.querySelectorAll('[data-task]').forEach(tab => tab.addEventListener('click', () => {
    activeTask = tab.dataset.task; activeTool = TASK_TOOLS[activeTask][0][0]; canvasMode = 'preview'; renderStudio();
  }));
  document.querySelectorAll('[data-canvas]').forEach(button => button.addEventListener('click', () => {
    if (button.dataset.canvas === 'map') selectTool('map'); else { canvasMode = 'preview'; renderStudio(); }
  }));
  document.querySelector('#viewport').addEventListener('change', event => { document.querySelector('#desktop-shell').style.width = event.target.value; });
  document.querySelector('#enter-preview').addEventListener('click', event => {
    previewReturnTarget = event.currentTarget;
    const shell = document.querySelector('#desktop-shell'); shell.classList.remove('preview-locked'); shell.classList.add('preview-active');
    const frame = document.querySelector('#desktop-frame'); frame.tabIndex = 0; frame.focus();
  });
  document.querySelector('#full-preview').addEventListener('click', () => document.querySelector('.workbench').classList.toggle('workbench--full'));
  const splitter = document.querySelector('#splitter');
  splitter.addEventListener('pointerdown', event => {
    const start = event.clientX; const width = document.querySelector('aside').getBoundingClientRect().width;
    splitter.setPointerCapture(event.pointerId);
    const move = next => document.documentElement.style.setProperty('--panel-width', Math.min(720, Math.max(320, width - (next.clientX - start))) + 'px');
    const stop = () => { splitter.removeEventListener('pointermove', move); splitter.removeEventListener('pointerup', stop); };
    splitter.addEventListener('pointermove', move); splitter.addEventListener('pointerup', stop);
  });
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
        if (isPreviewFrame) window.parent.postMessage({ type: 'studio-connection', state: 'connected' }, window.location.origin);
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
        if (isPreviewFrame) window.parent.postMessage({ type: 'studio-connection', state: 'disconnected' }, window.location.origin);
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
  window.addEventListener('keydown', event => {
    if (event.key === 'Escape') window.parent.postMessage({ type: 'studio-preview-exit' }, window.location.origin);
  }, true);
  createRoot(document.getElementById('desktop-root')).render(React.createElement(AuthoringDesktop));
} else {
  setupWorkbench();
  window.addEventListener('message', event => {
    if (event.origin !== window.location.origin) return;
    if (event.data?.type === 'studio-snapshot') renderWorkbench(event.data.snapshot);
    else if (event.data?.type === 'studio-result') showToast(event.data.result.ok ? 'Command completed' : event.data.result.error, !event.data.result.ok);
    else if (event.data?.type === 'studio-connection') {
      connectionState = event.data.state;
      if (currentSnapshot) renderWorkbench(currentSnapshot);
    } else if (event.data?.type === 'studio-preview-exit') {
      const shell = document.querySelector('#desktop-shell'); shell.classList.add('preview-locked'); shell.classList.remove('preview-active');
      document.querySelector('#desktop-frame').tabIndex = -1;
      (previewReturnTarget ?? document.querySelector('#enter-preview')).focus();
    }
  });
}
`;
