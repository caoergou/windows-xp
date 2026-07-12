/**
 * Reference lesson "Notepad basics" (#141).
 *
 * The acceptance flow — open Notepad, write a note, save it — expressed as pure
 * data. Each step advances only on a real, event-verified action:
 *   1. open Notepad  → `app:launch { appId: 'Notepad' }`
 *   2. write & save  → `file:create { nodeType: 'file' }` (Save As on a new note)
 *
 * Runs in `try` (hinted) or `do` (unhinted, scored) mode. Instruction/hint
 * strings are i18n keys resolved from the `lesson.*` namespace.
 */
import { defineLesson } from '../../lesson/types';

export const notepadBasicsLesson = defineLesson({
  id: 'lesson.notepad-basics',
  title: 'lesson.notepad.title',
  steps: [
    {
      instruction: 'lesson.notepad.step1',
      anchor: 'start-button',
      expect: { on: 'app:launch', appId: 'Notepad' },
      hints: [
        { afterMs: 12000, text: 'lesson.notepad.hint1a' },
        { afterMs: 30000, text: 'lesson.notepad.hint1b' },
      ],
      onWrongAction: 'nudge',
      demonstrate: { openApp: 'Notepad' },
    },
    {
      instruction: 'lesson.notepad.step2',
      anchor: 'notepad.textarea',
      expect: { on: 'file:create', nodeType: 'file' },
      hints: [{ afterMs: 15000, text: 'lesson.notepad.hint2' }],
      // Watch mode "saves" the note by creating the file the save would produce.
      demonstrate: {
        emit: { type: 'file:create', path: ['我的文档', '便签.txt'], name: '便签.txt', nodeType: 'file' },
      },
    },
  ],
});

export default notepadBasicsLesson;
