import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { format } from 'prettier';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const eventSource = await readFile(path.join(root, 'src/events.ts'), 'utf8');
const eventTypes = [
  ...new Set([...eventSource.matchAll(/\|?\s*\{ type: '([^']+)'/g)].map(match => match[1])),
];

const stringArray = { type: 'array', items: { type: 'string' } };
const flagValue = { type: ['string', 'number', 'boolean'] };
const event = {
  type: 'object',
  required: ['type'],
  properties: { type: { enum: eventTypes } },
  additionalProperties: true,
};
const objectCase = (required, properties, additionalProperties = false) => ({
  type: 'object',
  required,
  properties,
  additionalProperties,
});

const condition = {
  oneOf: [
    objectCase(['all'], { all: { type: 'array', items: { $ref: '#/definitions/condition' } } }),
    objectCase(['any'], { any: { type: 'array', items: { $ref: '#/definitions/condition' } } }),
    objectCase(['not'], { not: { $ref: '#/definitions/condition' } }),
    objectCase(['flag'], {
      flag: { type: 'string' },
      eq: flagValue,
      gte: { type: 'number' },
      lte: { type: 'number' },
    }),
    objectCase(['event'], { event: { type: 'object', additionalProperties: true } }),
    objectCase(['happened'], {
      happened: objectCase(
        ['type'],
        { type: { enum: eventTypes }, match: { type: 'object', additionalProperties: true } },
        false
      ),
    }),
    objectCase(['count'], {
      count: objectCase(
        ['type'],
        { type: { enum: eventTypes }, match: { type: 'object', additionalProperties: true } },
        false
      ),
      gte: { type: 'number' },
      lte: { type: 'number' },
      eq: { type: 'number' },
    }),
    objectCase(['exists'], { exists: stringArray }),
    objectCase(['unlocked'], { unlocked: stringArray }),
    objectCase(['contentContains'], {
      contentContains: objectCase(
        ['path', 'contains'],
        { path: stringArray, contains: { type: 'string' } },
        false
      ),
    }),
    objectCase(['pinned'], { pinned: { type: 'string' } }),
    objectCase(['linked'], {
      linked: objectCase(['a', 'b'], { a: { type: 'string' }, b: { type: 'string' } }, false),
    }),
    objectCase(['searched'], { searched: { type: 'string' } }),
    objectCase(['found'], { found: { type: 'string' } }),
  ],
};

const keyedText = properties => ({
  type: 'object',
  properties: Object.fromEntries(properties.map(key => [key, { type: 'string' }])),
  additionalProperties: true,
});
const action = {
  oneOf: [
    objectCase(['setFlag'], { setFlag: { type: 'string' }, value: flagValue }),
    objectCase(['incFlag'], { incFlag: { type: 'string' }, by: { type: 'number' } }),
    objectCase(['unlock'], { unlock: stringArray }),
    objectCase(['addFile'], {
      addFile: objectCase(
        ['path'],
        { path: stringArray, node: { type: 'object' }, contentKey: { type: 'string' } },
        false
      ),
    }),
    objectCase(['removeFile'], { removeFile: stringArray }),
    objectCase(['writeFile'], {
      writeFile: objectCase(
        ['path', 'content'],
        { path: stringArray, content: { type: 'string' } },
        false
      ),
    }),
    objectCase(['notify'], {
      notify: keyedText(['title', 'titleKey', 'body', 'bodyKey', 'icon', 'anchorId']),
    }),
    objectCase(['qqMessage'], {
      qqMessage: objectCase(
        ['buddyId'],
        { buddyId: { type: 'string' }, text: { type: 'string' }, textKey: { type: 'string' } },
        false
      ),
    }),
    objectCase(['qqOnline'], { qqOnline: { type: 'string' } }),
    objectCase(['openApp'], {
      openApp: objectCase(
        ['appId'],
        { appId: { type: 'string' }, props: { type: 'object', additionalProperties: true } },
        false
      ),
    }),
    objectCase(['openFile'], { openFile: stringArray }),
    objectCase(['playSound'], { playSound: { type: 'string' } }),
    objectCase(['emit'], { emit: event }),
    objectCase(['alert'], {
      alert: keyedText(['title', 'titleKey', 'message', 'messageKey']),
    }),
    objectCase(['note'], {
      note: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          titleKey: { type: 'string' },
          content: { type: 'string' },
          contentKey: { type: 'string' },
          x: { type: 'number' },
          y: { type: 'number' },
          color: { enum: ['yellow', 'blue', 'pink', 'green'] },
        },
        additionalProperties: false,
      },
    }),
    objectCase(['removeNote'], { removeNote: { type: 'string' } }),
    objectCase(['after'], {
      after: objectCase(
        ['ms', 'do'],
        {
          ms: { type: 'number', minimum: 0 },
          do: { type: 'array', items: { $ref: '#/definitions/action' } },
        },
        false
      ),
    }),
  ],
};

const scenarioSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: 'https://caoergou.github.io/windows-xp/schemas/scenario.schema.json',
  title: 'Windows XP Scenario',
  description: 'Declarative scenario rulebook consumed by @caoergou/windows-xp.',
  type: 'object',
  required: ['id', 'triggers'],
  additionalProperties: false,
  properties: {
    $schema: { type: 'string' },
    id: { type: 'string', minLength: 1 },
    initialFlags: { type: 'object', additionalProperties: flagValue },
    triggers: { type: 'array', items: { $ref: '#/definitions/trigger' } },
    strings: {
      type: 'object',
      additionalProperties: { type: 'object', additionalProperties: { type: 'string' } },
    },
    rehearsal: {
      type: 'object',
      required: ['walkthrough'],
      additionalProperties: false,
      properties: {
        walkthrough: {
          type: 'array',
          items: objectCase(['event'], { event, beat: { type: 'string', minLength: 1 } }, false),
        },
      },
    },
  },
  definitions: {
    condition,
    action,
    trigger: {
      type: 'object',
      required: ['on', 'do'],
      additionalProperties: false,
      properties: {
        id: { type: 'string' },
        on: {
          oneOf: [
            { enum: eventTypes },
            { type: 'array', minItems: 1, items: { enum: eventTypes } },
          ],
        },
        when: { $ref: '#/definitions/condition' },
        do: { type: 'array', minItems: 1, items: { $ref: '#/definitions/action' } },
        once: { type: 'boolean' },
        max: { type: 'number', minimum: 1 },
      },
    },
  },
};

const formatJson = (value, file) => format(JSON.stringify(value), { filepath: file });
const outputs = new Map([
  ['schema/scenario.json', await formatJson(scenarioSchema, 'schema/scenario.json')],
  [
    'schema/content-pack.json',
    await formatJson(
      JSON.parse(await readFile(path.join(root, 'src/content/content-pack.schema.json'), 'utf8')),
      'schema/content-pack.json'
    ),
  ],
]);
const check = process.argv.includes('--check');
for (const [relative, expected] of outputs) {
  const file = path.join(root, relative);
  if (check) {
    const actual = await readFile(file, 'utf8').catch(() => '');
    if (actual !== expected) {
      console.error(`${relative} is stale; run npm run schema:generate`);
      process.exitCode = 1;
    }
  } else {
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, expected, 'utf8');
  }
}
