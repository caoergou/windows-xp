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
const pendingAuthoring = new Map();
const injectedHistory = [];
const personaTranscript = [];
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
  pendingAuthoring.set(id, value);
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
      ...(step?.fired ?? []).map(value => '<span><b>Triggered</b> <button class="text-action" data-related-node="' + escapeHtml(value) + '">' + escapeHtml(value) + '</button></span>'),
      ...(step?.flagChanges ?? []).map(value => '<span><b>Flag</b> ' + escapeHtml(value.flag) + ': ' + escapeHtml(JSON.stringify(value.before)) + ' → ' + escapeHtml(JSON.stringify(value.after)) + '</span>'),
      ...(step?.actions ?? []).map(value => '<span><b>Action</b> ' + escapeHtml(actionSummary(value)) + '</span>'),
    ];
    return '<li class="timeline-step timeline-step--' + state + '"><button data-seek="' + escapeHtml(item.beat ?? '') + '" ' + (item.beat ? '' : 'disabled') + '><i aria-hidden="true"></i><span><strong>' + escapeHtml(item.beat ?? 'Unnamed step') + '</strong><code>' + escapeHtml(item.event.type) + '</code></span><em>' + position + '</em></button>' + (changes.length ? '<div class="step-changes">' + changes.join('') + '</div>' : '<p>No authored state change at this step.</p>') + '</li>';
  }).join('');
  const positionLabel = rehearsal?.active ? 'Rehearsing · ' + Math.max(0, current) + '/' + rehearsal.length : 'Not rehearsing';
  return '<div class="timeline-status"><strong>' + positionLabel + '</strong><span>Seek or step through the canonical tape</span></div><div class="toolbar"><button data-command="step-back">← Step</button><button data-command="step-forward">Step →</button><button data-command="exit">Exit rehearsal</button><button class="danger-action" data-command="reset">Reset desktop</button></div><ol class="timeline">' + rows + '</ol><p class="notice">Delayed actions collapse during rehearsal; non-filesystem UI state is not reconstructed pixel-exactly.</p>';
};
const diagnosticCard = item => {
  const position = item.range?.start;
  const location = item.source ? item.source + (position ? ':' + position.line + ':' + position.column : '') : '';
  const editor = item.source && position ? 'vscode://file' + item.source + ':' + position.line + ':' + position.column : '';
  return '<article class="diagnostic diagnostic--' + item.level + '"><strong>' + escapeHtml(item.code) + '</strong><span>' + escapeHtml(item.message) + '</span><code>' + escapeHtml(item.path ?? '') + '</code>' + (location ? '<small>' + escapeHtml(location) + '</small><div class="source-actions"><button data-copy-source="' + escapeHtml(location) + '">Copy location</button>' + (item.path ? '<button data-related-node="' + escapeHtml(item.path) + '">Show related</button>' : '') + (editor ? '<a href="' + escapeHtml(editor) + '">Open in VS Code</a>' : '<span>Exact source range unavailable for this export.</span>') + '</div>' : '') + (item.help ? '<small>' + escapeHtml(item.help) + '</small>' : '') + '</article>';
};
const EVENT_FORMS = {
  'file:open': [['path', 'File path', 'path'], ['name', 'File name', 'text'], ['nodeType', 'Node type', 'text']],
  'file:unlock': [['name', 'File name', 'text']],
  'ie:navigate': [['url', 'URL', 'text']],
  'notification:click': [['id', 'Notification id', 'text']],
  'cmd:exec': [['command', 'Command', 'text']],
  'qq:message': [['buddyId', 'Buddy', 'buddy'], ['direction', 'Direction', 'direction'], ['text', 'Message', 'text']],
  'qq:reply': [['buddyId', 'Buddy', 'buddy'], ['text', 'Reply', 'text']],
};
const eventFields = (type, snapshot) => {
  const fields = EVENT_FORMS[type] ?? [];
  if (!fields.length) return '<p class="notice">This event has no guided fields. Inject it directly or use Advanced JSON when its payload requires additional data.</p>';
  return fields.map(([name, label, kind]) => {
    if (kind === 'buddy') return '<label>' + label + '<select data-event-field="' + name + '">' + snapshot.buddies.map(value => '<option value="' + escapeHtml(value.id) + '">' + escapeHtml(value.id) + '</option>').join('') + '</select></label>';
    if (kind === 'direction') return '<label>' + label + '<select data-event-field="' + name + '"><option>incoming</option><option>outgoing</option></select></label>';
    return '<label>' + label + '<input data-event-field="' + name + '" data-field-kind="' + kind + '" placeholder="' + (kind === 'path' ? 'folder/file.txt' : label) + '" required></label>';
  }).join('');
};
const eventHistory = () => injectedHistory.length ? '<div class="event-history"><h3>Recent injections</h3>' + injectedHistory.slice(-5).reverse().map(item => '<button data-replay-event="' + encodeURIComponent(JSON.stringify(item)) + '"><code>' + escapeHtml(item.type) + '</code><span>' + escapeHtml(JSON.stringify(item).slice(0, 90)) + '</span></button>').join('') + '</div>' : '<p class="notice">Injected events will appear here for quick replay.</p>';
const personaContent = snapshot => snapshot.buddies.length ? snapshot.buddies.map(item => {
  const transcript = personaTranscript.filter(entry => entry.buddy === item.id).slice(-4);
  return '<article class="buddy"><div class="buddy-heading"><strong>' + escapeHtml(item.id) + '</strong><span>Offline fallback ' + (item.hasFallback ? 'ready' : 'missing') + '</span></div><label>Message<textarea data-persona-message="' + escapeHtml(item.id) + '" rows="2" placeholder="Write a rehearsal message…"></textarea></label><div class="persona-modes"><button data-chat="mock" data-buddy="' + escapeHtml(item.id) + '">Mock</button><button data-chat="offline" data-buddy="' + escapeHtml(item.id) + '" ' + (item.hasFallback ? '' : 'disabled') + '>Offline</button><button data-chat="provider" data-buddy="' + escapeHtml(item.id) + '" ' + (item.hasProvider ? '' : 'disabled') + '>Provider</button></div>' + (transcript.length ? '<div class="transcript">' + transcript.map(entry => '<div><span class="provenance">' + escapeHtml(entry.mode) + '</span><p><b>You</b> ' + escapeHtml(entry.message) + '</p><p><b>' + escapeHtml(item.id) + '</b> ' + escapeHtml(entry.response ?? entry.error) + '</p></div>').join('') + '</div>' : '<p class="notice">Run a mode to compare authored responses.</p>') + '</article>';
}).join('') : '<div class="empty-state"><strong>No authored personas.</strong><span>Add a buddy profile with a deterministic fallback to rehearse conversations here.</span></div>';
const shippingContent = snapshot => {
  const report = snapshot.pack.result;
  if (!report) return '<div class="empty-state"><strong>No pack report available.</strong><span>Open a ContentPack input to inspect assets and shipping budgets.</span></div>';
  const percent = Math.min(100, Math.round(report.scenarioBytes / report.scenarioLimitBytes * 100));
  const displayPercent = percent === 0 && report.scenarioBytes > 0 ? '&lt;1' : String(percent);
  const blockers = [['Lint', snapshot.lint], ['Solve', snapshot.solve], ['Pack', snapshot.pack]].filter(([, value]) => value.status === 'fail');
  const assets = [...report.assets].sort((a, b) => (b.bytes ?? -1) - (a.bytes ?? -1));
  return '<div class="ship-summary"><div><span>Scenario budget</span><strong>' + report.scenarioBytes + ' / ' + report.scenarioLimitBytes + ' B</strong></div><div class="budget"><i style="width:' + Math.max(1, percent) + '%"></i></div><small>' + displayPercent + '% used · packed total ' + report.totalBytes + ' B</small></div>' + (blockers.length ? '<div class="ship-blockers"><strong>Shipping blocked</strong>' + blockers.map(([name]) => '<span>' + name + ' gate failed</span>').join('') + '</div>' : '<div class="ship-ready"><strong>All shipping gates pass.</strong><span>Review the largest assets before publishing.</span></div>') + '<div class="asset-heading"><h3>Largest assets</h3><span>' + assets.length + ' declared</span></div>' + assets.map((item, index) => '<div class="asset"><b>' + (index + 1) + '</b><code>' + escapeHtml(item.key) + '</code><span>' + escapeHtml(item.source) + '</span><strong>' + escapeHtml(item.bytes ?? 'remote') + (item.bytes === null ? '' : ' B') + '</strong></div>').join('');
};
const toolContent = (name, snapshot) => {
  if (name === 'problems') {
    const items = snapshot.lint.result?.diagnostics ?? [];
    return '<div class="gate-row">Lint ' + gate(snapshot.lint) + ' Solve ' + gate(snapshot.solve) + ' Pack ' + gate(snapshot.pack) + '</div>' + (items.length ? items.map(diagnosticCard).join('') : '<div class="empty-state"><strong>The draft is structurally clean.</strong><span>Open Story map to inspect pacing and dependencies, or move to Rehearse to verify the player path.</span><button data-open-tool="map">Open Story map</button></div>');
  }
  if (name === 'map') return '<div class="context-heading"><span>Selected node</span><strong>' + escapeHtml(selectedNodeId ?? 'None') + '</strong></div><section id="selection-detail" aria-live="polite"><p class="notice">Select a node in the map to inspect its dependencies and rehearsal link.</p></section>';
  if (name === 'timeline') return timelineContent(snapshot);
  if (name === 'inspector') {
    const key = selectedNodeId?.replace(/^.*:/, '');
    const triggers = key ? (snapshot.runtime?.triggers ?? []).filter(item => item.id === key || item.id?.includes(key)) : snapshot.runtime?.triggers;
    return (selectedNodeId ? '<p>Selected graph node: <code>' + escapeHtml(selectedNodeId) + '</code></p>' : '') + '<h3>Trigger conditions</h3><pre>' + escapeHtml(JSON.stringify(triggers ?? { waiting: 'desktop status' }, null, 2)) + '</pre><h3>Recent events</h3><pre>' + escapeHtml(JSON.stringify(snapshot.recentEvents, null, 2)) + '</pre>';
  }
  if (name === 'events') { const initial = 'file:open'; return '<label>Event type<select id="event-type">' + ${JSON.stringify([...KNOWN_EVENT_TYPES])}.map(value => '<option ' + (value === initial ? 'selected' : '') + '>' + escapeHtml(value) + '</option>').join('') + '</select></label><div id="event-fields">' + eventFields(initial, snapshot) + '</div><details><summary>Advanced JSON</summary><label>Additional payload<textarea id="event-payload" rows="5">{}</textarea></label></details><button class="primary-action" data-command="emit">Inject event</button>' + eventHistory() + '<hr><label>Temporary flag<select id="flag-name">' + snapshot.flags.map(value => '<option>' + escapeHtml(value) + '</option>').join('') + '</select></label><label>Value (JSON)<input id="flag-value" value="true"></label><button data-command="flag">Override for rehearsal</button>'; }
  if (name === 'personas') return personaContent(snapshot);
  return shippingContent(snapshot);
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
const readGuidedEvent = () => {
  const type = document.querySelector('#event-type').value;
  const event = { type };
  document.querySelectorAll('[data-event-field]').forEach(input => {
    const value = input.value.trim();
    if (input.required && !value) throw new Error(input.closest('label').firstChild.textContent + ' is required');
    if (!value) return;
    event[input.dataset.eventField] = input.dataset.fieldKind === 'path' ? value.split(/[\\/]/).filter(Boolean) : value;
  });
  const advanced = document.querySelector('#event-payload')?.value.trim();
  if (advanced) Object.assign(event, JSON.parse(advanced));
  if (type === 'file:open') {
    event.name ||= event.path?.at(-1) ?? '';
    event.nodeType ||= 'file';
  }
  return event;
};
const openRelatedNode = query => {
  const raw = String(query);
  const key = (raw.includes('.') ? raw.slice(raw.lastIndexOf('.') + 1) : raw).replaceAll('["', '').replaceAll('"]', '').toLowerCase();
  const node = currentSnapshot.graph.nodes.find(item => item.id.toLowerCase().includes(key) || item.label.toLowerCase().includes(key));
  if (!node) { showToast('No related graph node found', true); return; }
  selectedNodeId = node.id;
  selectTool('map');
};
const bindPanel = () => {
  document.querySelectorAll('[data-command]').forEach(button => button.addEventListener('click', () => {
    const action = button.dataset.command;
    if (action === 'step-back') command({ type: 'step', direction: 'back' });
    else if (action === 'step-forward') command({ type: 'step', direction: 'forward' });
    else if (action === 'exit') command({ type: 'exit-rehearsal' });
    else if (action === 'reset') command({ type: 'reset' });
    else if (action === 'emit') {
      try { const event = readGuidedEvent(); injectedHistory.push(event); command({ type: 'emit', event }); }
      catch (error) { showToast(error.message, true); }
    } else if (action === 'flag') {
      try { command({ type: 'flag-set', flag: document.querySelector('#flag-name').value, value: JSON.parse(document.querySelector('#flag-value').value) }); }
      catch (error) { showToast(error.message, true); }
    }
  }));
  document.querySelectorAll('[data-seek]').forEach(button => button.addEventListener('click', () => command({ type: 'seek', beat: button.dataset.seek })));
  document.querySelectorAll('[data-tool]').forEach(button => button.addEventListener('click', () => selectTool(button.dataset.tool)));
  document.querySelectorAll('[data-open-tool]').forEach(button => button.addEventListener('click', () => selectTool(button.dataset.openTool)));
  document.querySelector('#event-type')?.addEventListener('change', event => { document.querySelector('#event-fields').innerHTML = eventFields(event.target.value, currentSnapshot); });
  document.querySelectorAll('[data-replay-event]').forEach(button => button.addEventListener('click', () => { const event = JSON.parse(decodeURIComponent(button.dataset.replayEvent)); injectedHistory.push(event); command({ type: 'emit', event }); }));
  document.querySelectorAll('[data-copy-source]').forEach(button => button.addEventListener('click', async () => { await navigator.clipboard.writeText(button.dataset.copySource); showToast('Location copied'); }));
  document.querySelectorAll('[data-related-node]').forEach(button => button.addEventListener('click', () => openRelatedNode(button.dataset.relatedNode)));
  document.querySelectorAll('[data-chat]').forEach(button => button.addEventListener('click', () => {
    const input = document.querySelector('[data-persona-message="' + CSS.escape(button.dataset.buddy) + '"]');
    const message = input.value.trim();
    if (!message) { showToast('Write a rehearsal message first', true); input.focus(); return; }
    command({ type: 'chat-rehearse', buddy: button.dataset.buddy, message, mode: button.dataset.chat });
  }));
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
    else if (event.data?.type === 'studio-result') {
      const result = event.data.result;
      const authoredCommand = pendingAuthoring.get(result.id);
      pendingAuthoring.delete(result.id);
      if (authoredCommand?.type === 'chat-rehearse') {
        personaTranscript.push({ buddy: authoredCommand.buddy, message: authoredCommand.message, mode: authoredCommand.mode, ...(result.ok ? { response: result.data?.text ?? '' } : { error: result.error }) });
        if (activeTool === 'personas') renderStudio();
      }
      showToast(result.ok ? 'Command completed' : result.error, !result.ok);
    }
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
