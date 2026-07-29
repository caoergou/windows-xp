import { WindowsXP } from '@caoergou/windows-xp';
import '@caoergou/windows-xp/style.css';

const files = {
  'START HERE.txt': {
    type: 'file',
    name: 'START HERE.txt',
    app: 'Notepad',
    content: 'The desktop can react to every file the player opens.',
  },
  'My Project': {
    type: 'folder',
    name: 'My Project',
    children: {
      'clue.txt': {
        type: 'file',
        name: 'clue.txt',
        app: 'Notepad',
        content: 'Custom content is plain serializable data.',
      },
    },
  },
};

const scenario = {
  id: 'online-template-v1',
  strings: {
    en: {
      'opened.title': 'Story event',
      'opened.body': 'The scenario noticed that you opened the file.',
      'next.content': 'This file was created by a declarative scenario action.',
    },
  },
  triggers: [
    {
      id: 'open-start-file',
      on: 'file:open',
      when: { event: { name: 'START HERE.txt' } },
      once: true,
      do: [
        { notify: { titleKey: 'opened.title', bodyKey: 'opened.body' } },
        {
          addFile: {
            path: ['NEXT.txt'],
            node: { type: 'file', name: 'NEXT.txt', app: 'Notepad' },
            contentKey: 'next.content',
          },
        },
      ],
    },
  ],
};

export default function App() {
  return (
    <WindowsXP autoLogin skipBoot persistence="none" customFileSystem={files} scenario={scenario} />
  );
}
