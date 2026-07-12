#!/usr/bin/env node
/**
 * Event reference generator (#130).
 *
 * `src/events.ts` is the single source of truth for the XPEvent catalog. This
 * script parses the `XPEvent` union — each member's `type` literal, its payload
 * fields, and the one-line JSDoc above it — and regenerates the reference table
 * in `USAGE.md`, between the `<!-- EVENTS:START -->` / `<!-- EVENTS:END -->`
 * markers, grouped by domain.
 *
 *   node scripts/gen-events-doc.mjs           # write USAGE.md in place
 *   node scripts/gen-events-doc.mjs --check   # exit 1 if USAGE.md is stale
 *
 * `test/eventDocs.test.ts` runs the --check path so docs can never drift from
 * the type definitions (mirrors the doc-examples drift guard, #75).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const EVENTS_TS = join(ROOT, 'src', 'events.ts');
// The event reference table lives on the docs site's Events page (#214); USAGE
// is now a thin jump index. The generator rewrites the region between markers.
const EVENTS_MD = join(ROOT, 'docs-site', 'guide', 'events.md');
const START = '<!-- EVENTS:START -->';
const END = '<!-- EVENTS:END -->';

/** Extract the `export type XPEvent = …` block (up to the next declaration). */
const extractUnionBlock = (src) => {
  const start = src.indexOf('export type XPEvent =');
  if (start === -1) throw new Error('XPEvent union not found in src/events.ts');
  // Members contain their own `;`, so terminate at the next top-level
  // declaration (`export type XPEventType …`) rather than the first semicolon.
  const end = src.indexOf('export type XPEventType', start);
  return src.slice(start, end === -1 ? undefined : end);
};

/** Payload fields of a member object literal, minus the `type` discriminant. */
const parsePayload = (objBody) => {
  return objBody
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((field) => {
      const m = field.match(/^([A-Za-z0-9_]+)(\??)\s*:/);
      if (!m) return null;
      if (m[1] === 'type') return null;
      return `${m[1]}${m[2]}`;
    })
    .filter(Boolean);
};

const parseEvents = (block) => {
  const lines = block.split('\n');
  const events = [];
  let pendingDoc = null;
  for (const line of lines) {
    const docMatch = line.match(/\/\*\*\s*(.*?)\s*\*\//);
    if (docMatch && !line.includes('type:')) {
      pendingDoc = docMatch[1];
      continue;
    }
    // A union member: `| { type: 'domain:action'; … }` possibly with a leading
    // JSDoc on the same line.
    // Tolerate a trailing `;` on the final union member (it terminates the
    // whole `type` declaration) so the last event is never dropped from the table.
    const memberMatch = line.match(/\|\s*\{\s*type:\s*'([^']+)'\s*;?\s*(.*)\}\s*;?\s*$/);
    if (memberMatch) {
      const inlineDoc = line.match(/\/\*\*\s*(.*?)\s*\*\//);
      const type = memberMatch[1];
      const rest = memberMatch[2];
      events.push({
        type,
        domain: type.split(':')[0],
        payload: parsePayload(rest),
        doc: (inlineDoc ? inlineDoc[1] : pendingDoc) || '',
      });
      pendingDoc = null;
    }
  }
  return events;
};

const DOMAIN_TITLES = {
  app: 'Application',
  window: 'Window',
  startmenu: 'Start menu',
  contextmenu: 'Context menu',
  file: 'Filesystem — files',
  folder: 'Filesystem — folders',
  recyclebin: 'Filesystem — Recycle Bin',
  password: 'Access control',
  session: 'Session',
  cmd: 'Command Prompt',
  ie: 'Internet Explorer',
  wallpaper: 'Appearance',
  screensaver: 'Appearance',
  notification: 'Tray notifications',
  time: 'Timers',
  user: 'Idle detection',
  qq: 'QQ Messenger',
  game: 'Games',
  media: 'Media playback',
  search: 'Search oracle',
  evidence: 'Evidence board',
  deduction: 'Deduction forms',
  lesson: 'Guided lessons',
  install: 'Software install',
  ui: 'Semantic UI actions',
  link: 'Outbound links',
};

const renderTable = (events) => {
  const out = [];
  out.push(START);
  out.push('');
  out.push('| Event | Payload | Description |');
  out.push('| --- | --- | --- |');
  for (const e of events) {
    const payload = e.payload.length ? e.payload.map((p) => `\`${p}\``).join(', ') : '—';
    const doc = e.doc.replace(/\|/g, '\\|');
    out.push(`| \`${e.type}\` | ${payload} | ${doc} |`);
  }
  out.push('');
  out.push('_Generated from `src/events.ts` by `npm run docs:events` — do not edit by hand._');
  out.push('');
  out.push(END);
  return out.join('\n');
};

const src = readFileSync(EVENTS_TS, 'utf8');
const events = parseEvents(extractUnionBlock(src));
if (events.length === 0) throw new Error('No events parsed — check the union format');
// Surface any member missing a description so the table never ships blank cells.
const undocumented = events.filter((e) => !e.doc);
if (undocumented.length) {
  console.error('Events missing a JSDoc description:\n  ' + undocumented.map((e) => e.type).join('\n  '));
  process.exit(1);
}

const table = renderTable(events);
const page = readFileSync(EVENTS_MD, 'utf8');
const startIdx = page.indexOf(START);
const endIdx = page.indexOf(END);
if (startIdx === -1 || endIdx === -1) {
  console.error(`docs-site/guide/events.md is missing the ${START} / ${END} markers.`);
  process.exit(1);
}
const next = page.slice(0, startIdx) + table + page.slice(endIdx + END.length);

const check = process.argv.includes('--check');
if (check) {
  if (next !== page) {
    console.error(
      'docs-site/guide/events.md event table is stale. Run `npm run docs:events` and commit the result.'
    );
    process.exit(1);
  }
  console.log(`event docs OK: ${events.length} events in sync`);
} else {
  if (next !== page) {
    writeFileSync(EVENTS_MD, next);
    console.log(`Wrote ${events.length} events to docs-site/guide/events.md`);
  } else {
    console.log(`docs-site/guide/events.md already up to date (${events.length} events)`);
  }
}
