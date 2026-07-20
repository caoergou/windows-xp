import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { ContentPack } from '../src/content/types';
import { prologueGraph } from '../src/data/scenarios/prologueGraph';
import type { PuzzleGraph } from '../src/scenario/puzzleGraph';
import type { Scenario } from '../src/scenario/types';
import { KNOWN_EVENT_TYPES } from '../tools/scenario-tools/src/eventTypes';
import {
  buildAuthoringGraph,
  buildAuthoringSnapshot,
  lintContentPack,
  lintGraph,
  lintScenario,
  loadInput,
  migrateScenarioSave,
  packDirectory,
  renderAuthoringGraph,
  solveAuthoredValue,
} from '../tools/scenario-tools/src';
import { buildBrowserClientSource } from '../tools/scenario-tools/src/serveClient';
import {
  buildRehearsalProfile,
  collectBuddies,
  replyTexts,
} from '../tools/scenario-tools/src/serveChat';
import {
  AUTHORING_PROTOCOL_VERSION,
  completeRepl,
  isAuthoringCommandRequest,
  parseReplCommand,
  replToAuthoringCommand,
} from '../tools/scenario-tools/src/serveProtocol';

const codes = (diagnostics: { code: string }[]): string[] => diagnostics.map(item => item.code);

describe('scenario-tools', () => {
  it('keeps the exact event-name catalog aligned with the engine source of truth', async () => {
    const source = await readFile(path.resolve('src/events.ts'), 'utf8');
    const engineEvents = [...source.matchAll(/\|?\s*\{ type: '([^']+)'/g)].map(match => match[1]);
    expect([...KNOWN_EVENT_TYPES].sort()).toEqual([...new Set(engineEvents)].sort());
  });

  it('reports exact event errors, duplicate ids, and dead flags', () => {
    const scenario = {
      id: 'broken',
      triggers: [
        { id: 'same', on: 'file:opne', do: [{ setFlag: 'unused' }] },
        { id: 'same', on: 'file:open', do: [{ notify: { title: 'inline' } }] },
      ],
    } as Scenario;
    const result = lintScenario(scenario);
    expect(result.ok).toBe(false);
    expect(codes(result.diagnostics)).toEqual(
      expect.arrayContaining(['unknown-event', 'duplicate-trigger-id', 'dead-flag'])
    );
  });

  it('reuses graph linting for deadlocks and missing hint ladders', () => {
    const graph: PuzzleGraph = {
      id: 'deadlock',
      puzzles: [
        {
          id: 'a',
          requires: ['b'],
          on: 'file:open',
          solvedWhen: { event: { name: 'a' } },
        },
        {
          id: 'b',
          requires: ['a'],
          on: 'file:open',
          solvedWhen: { event: { name: 'b' } },
        },
      ],
    };
    const result = lintGraph(graph);
    expect(result.ok).toBe(false);
    expect(result.diagnostics.some(item => item.message.includes('dependency cycle'))).toBe(true);
    expect(result.diagnostics.some(item => item.message.includes('hint ladder'))).toBe(true);
  });

  it('reports broken, orphaned, conflicting, and mutually exclusive content', async () => {
    const pack = {
      id: 'broken-pack',
      assets: {
        used: '<p>used</p>',
        orphan: '<p>orphan</p>',
      },
      sites: {
        'https://www.example.com/': { html: { asset: 'used' } },
        'http://example.com': { html: { asset: 'missing' } },
      },
      files: {
        'bad.txt': {
          type: 'file',
          name: 'bad.txt',
          content: 'inline',
          contentRef: { asset: 'missing' },
        },
      },
    } as unknown as ContentPack;
    const result = await lintContentPack(pack);
    expect(result.ok).toBe(false);
    expect(codes(result.diagnostics)).toEqual(
      expect.arrayContaining(['broken-asset', 'orphan-asset', 'site-conflict', 'content-exclusive'])
    );
  });

  it('requires provider fallbacks and validates declared context', () => {
    const scenario: Scenario = {
      id: 'provider',
      triggers: [
        {
          on: 'qq:reply',
          do: [
            {
              openApp: {
                appId: 'QQ',
                props: {
                  reply: {
                    provider: 'chat',
                    context: [{ flags: ['missing'] }, { fileSummary: { path: ['missing.txt'] } }],
                  },
                },
              },
            },
          ],
        },
      ],
    };
    const result = lintScenario(scenario, { files: {} });
    expect(codes(result.diagnostics)).toEqual(
      expect.arrayContaining(['provider-fallback', 'provider-flag', 'provider-file'])
    );
  });

  it('solves the reference graph and emits a directly renderable Mermaid map', async () => {
    const solved = await solveAuthoredValue('graph', prologueGraph);
    expect(solved.ok).toBe(true);
    expect(solved.steps).toHaveLength(4);
    expect(solved.steps.at(-1)?.fired).toContain('puzzle:unlock-windows');

    const mermaid = renderAuthoringGraph(buildAuthoringGraph('graph', prologueGraph), 'mermaid');
    expect(mermaid).toContain('graph TD');
    expect(mermaid).toContain('classDef gate');
    expect(mermaid).toContain('n2 --> n3');
  });

  it('validates and normalizes the directory reference pack with a split size report', async () => {
    const result = await packDirectory(path.resolve('examples/reference-content-pack'), {
      check: true,
    });
    expect(result.ok).toBe(true);
    expect(result.report.logicBytes).toBeGreaterThan(0);
    expect(result.report.assetBytes).toBeGreaterThan(0);
    expect(result.report.assets).toHaveLength(2);
    expect(result.pack.assets?.['bbs-home']).toContain('<!doctype html>');
    expect(collectBuddies(result.pack).map(item => item.id)).toContain('crystal');
  });

  it('diagnoses orphan progress and only applies explicit migration maps', () => {
    const scenario: Scenario = {
      id: 'new-story',
      triggers: [
        {
          id: 'new-trigger',
          on: 'file:open',
          when: { flag: 'new-flag' },
          once: true,
          do: [{ setFlag: 'complete' }],
        },
      ],
    };
    const result = migrateScenarioSave(
      scenario,
      {
        scenarioId: 'old-story',
        flags: { 'old-flag': true, deleted: true },
        fires: { 'old-trigger': 1, deleted: 2 },
      },
      {
        flags: { 'old-flag': 'new-flag' },
        triggers: { 'old-trigger': 'new-trigger' },
        dropOrphans: true,
      }
    );
    expect(result.ok).toBe(true);
    expect(result.save.flags).toEqual({ 'new-flag': true });
    expect(result.save.fires).toEqual({ 'new-trigger': 1 });
    expect(codes(result.diagnostics)).toEqual(
      expect.arrayContaining(['scenario-id-changed', 'orphan-flag', 'orphan-fire'])
    );
  });

  it('parses typed serve commands and completes live authoring identifiers', () => {
    expect(parseReplCommand('emit file:open path=["recycle_bin","letter.txt"]')).toEqual({
      kind: 'emit',
      event: { type: 'file:open', path: ['recycle_bin', 'letter.txt'] },
    });
    expect(parseReplCommand('flag set unlocked true')).toEqual({
      kind: 'flag-set',
      flag: 'unlocked',
      value: true,
    });
    expect(parseReplCommand('chat --offline guide "Where next?"')).toEqual({
      kind: 'chat',
      buddy: 'guide',
      message: 'Where next?',
      offline: true,
    });
    expect(completeRepl('seek fi', { beats: ['intro', 'finale'], flags: [], buddies: [] })).toEqual(
      [['finale'], 'fi']
    );
    expect(() => parseReplCommand('emit made:up')).toThrow('unknown XP event type');
  });

  it('uses one versioned structured command contract for the REPL and Scenario Studio', () => {
    const repl = parseReplCommand('seek finale');
    expect(repl && replToAuthoringCommand(repl)).toEqual({ type: 'seek', beat: 'finale' });
    expect(
      isAuthoringCommandRequest({
        type: 'authoring-command',
        id: 'ui-1',
        protocolVersion: AUTHORING_PROTOCOL_VERSION,
        command: { type: 'seek', beat: 'finale' },
      })
    ).toBe(true);
    expect(
      isAuthoringCommandRequest({
        type: 'authoring-command',
        id: 'ui-1',
        protocolVersion: AUTHORING_PROTOCOL_VERSION + 1,
        command: { type: 'seek', beat: 'finale' },
      })
    ).toBe(false);
    expect(
      isAuthoringCommandRequest({
        type: 'authoring-command',
        id: 'ui-2',
        protocolVersion: AUTHORING_PROTOCOL_VERSION,
        command: { type: 'unknown' },
      })
    ).toBe(false);
  });

  it('builds a JSON-serializable Scenario Studio snapshot with independent gates', async () => {
    const input = await loadInput(path.resolve('examples/midsummer-pack'));
    const snapshot = await buildAuthoringSnapshot(input, 1, {
      status: 'current',
      lastValidAt: '2026-07-20T00:00:00.000Z',
    });
    expect(snapshot.protocolVersion).toBe(AUTHORING_PROTOCOL_VERSION);
    expect(snapshot.lint.status).toBe('pass');
    expect(snapshot.solve.status).toBe('pass');
    expect(snapshot.pack.status).toBe('pass');
    expect(snapshot.graph.nodes.length).toBeGreaterThan(0);
    expect(snapshot.solve.result?.steps[0]).toEqual(
      expect.objectContaining({
        flagChanges: expect.any(Array),
        actions: expect.any(Array),
      })
    );
    expect(() => JSON.stringify(snapshot)).not.toThrow();
  });

  it('discovers provider buddies and their deterministic offline replies', () => {
    const authored = {
      qq: {
        buddies: [
          {
            id: 'guide',
            reply: {
              kind: 'provider',
              provider: 'chat',
              fallback: { steps: [{ text: 'Look in the letter.' }, { text: 'Check the bin.' }] },
            },
          },
        ],
      },
    };
    const buddy = collectBuddies(authored)[0];
    expect(buddy.id).toBe('guide');
    expect(replyTexts((buddy.value.reply as { fallback: unknown }).fallback)).toEqual([
      'Look in the letter.',
      'Check the bin.',
    ]);
    expect(buildRehearsalProfile(buddy).buddies[0]).toMatchObject({
      id: 'guide',
      nickname: 'guide',
      group: 'scenario-authoring',
      status: 'online',
    });
  });

  it('builds a tokenized browser bridge over the public WindowsXP handle', () => {
    const source = buildBrowserClientSource({
      engineModule: '/@fs/engine.tsx',
      scenarioModule: '/@fs/scenario.ts',
      controlUrl: 'ws://localhost:5174?token=secret',
      storagePrefix: 'authoring:',
      language: 'zh',
    });
    expect(source).toContain('new WebSocket(controlUrl)');
    expect(source).toContain("command.type === 'status'");
    expect(source).toContain('handle.scenario.setFlag');
    expect(source).toContain('handle.qq.loadProfile(command.profile)');
    expect(source).toContain('handle.qq.sendMessage');
    expect(source).toContain('ws://localhost:5174?token=secret');
  });

  it('builds Scenario Studio around a serialized last-valid authored value', () => {
    const source = buildBrowserClientSource({
      engineModule: '/@fs/engine.tsx',
      authoredValue: { id: 'draft', triggers: [] },
      controlUrl: 'ws://localhost:5174?token=secret',
      storagePrefix: 'authoring:',
      language: 'zh',
      workbench: true,
    });
    expect(source).toContain("type: 'authoring-command'");
    expect(source).toContain("request?.type === 'snapshot'");
    expect(source).toContain('Scenario Studio');
    expect(source).toContain('iframe id="desktop-frame"');
    expect(source).toContain("window.location.pathname === '/preview'");
    expect(source).toContain("[['build','Build'],['rehearse','Rehearse']");
    expect(source).toContain('class="preview-shield"');
    expect(source).toContain("type: 'studio-preview-exit'");
    expect(source).toContain('flagChanges');
    expect(source).toContain('EVENT_FORMS');
    expect(source).toContain('injectedHistory');
    expect(source).toContain('personaTranscript');
    expect(source).toContain('vscode://file');
    expect(source).toContain('Shipping blocked');
    expect(source).not.toContain('import * as authoredModule');
  });
});
