import { defineScenario } from '../../scenario';

/**
 * "Prologue" demo scenario (#84) — a short, playable-through story authored
 * entirely as data (no React). It exercises all three story mechanisms:
 *
 *  - **push**: tray balloons and new files appear on their own (`notify`/`addFile`);
 *  - **gate**: a password-locked file blocks progress until the clue is read;
 *  - **progress**: `flags` + the event journal drive the chapters and survive reload.
 *
 * Play it: log in, open **My Documents → readme.txt**, read **线索.txt** (the
 * clue), then open **秘密.txt** and enter the year **2007**. Files live under the
 * `我的文档` key so the flow works in both the `en` and `zh` desktops.
 */
export const prologueScenario = defineScenario({
  id: 'prologue',
  flags: {},
  triggers: [
    {
      id: 'intro',
      on: 'scenario:start',
      once: true,
      actions: [
        {
          notify: {
            icon: 'network',
            title: 'You have unfinished business',
            body: 'Someone left something behind. Start in My Documents — open readme.txt.',
          },
        },
      ],
    },
    {
      // Opening readme.txt reveals a clue and a locked secret in My Documents.
      id: 'reveal-clue',
      on: 'file:open',
      when: { match: { name: 'readme.txt' } },
      once: true,
      actions: [
        { setFlag: 'readReadme' },
        {
          addFile: {
            path: ['我的文档', '线索.txt'],
            content:
              'The lock wants a year.\r\n\r\nIt was the year everyone went online — 2007.',
            app: 'Notepad',
          },
        },
        {
          addFile: {
            path: ['我的文档', '秘密.txt'],
            locked: true,
            password: '2007',
            content:
              'You made it.\r\n\r\nThis file was sealed until you found the year. The rest of the story is yours to write.',
            app: 'Notepad',
          },
        },
        {
          notify: {
            icon: 'network',
            title: 'New files in My Documents',
            body: 'A clue (线索.txt) and a locked file (秘密.txt) just appeared.',
          },
        },
      ],
    },
    {
      // A wrong password nudges the player toward the clue.
      id: 'wrong-password-hint',
      on: 'password:fail',
      when: { match: { name: '秘密.txt' } },
      actions: [
        { notify: { icon: 'network', title: 'Not quite', body: 'Re-read 线索.txt — it names the year.' } },
      ],
    },
    {
      // Opening 秘密.txt only fires after the correct password unlocks it.
      id: 'solved',
      on: 'file:open',
      when: { allOf: [{ match: { name: '秘密.txt' } }, { flag: 'readReadme' }] },
      once: true,
      actions: [
        { setFlag: 'solved' },
        { playSound: 'ding' },
        {
          addFile: {
            path: ['我的文档', '结局.txt'],
            content: 'Chapter one complete. Thanks for playing the prologue.',
            app: 'Notepad',
          },
        },
        {
          notify: {
            icon: 'network',
            title: 'Prologue complete',
            body: 'The seal is broken. See 结局.txt for the payoff.',
          },
        },
      ],
    },
  ],
});

export default prologueScenario;
