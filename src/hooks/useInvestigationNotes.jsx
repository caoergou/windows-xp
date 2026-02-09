import { useEffect } from 'react';
import { useUserProgress } from '../context/UserProgressContext';
import { useWindowManager } from '../context/WindowManagerContext';
import { useFileSystem } from '../context/FileSystemContext';
import AutoTypingNotepad from '../apps/AutoTypingNotepad';

// Import note contents
import note01 from '../data/investigation_notes/note_01_my_memories.txt?raw';
import note02 from '../data/investigation_notes/note_02_after_album.txt?raw';
import note03 from '../data/investigation_notes/note_03_after_father_log_1.txt?raw';
import note04 from '../data/investigation_notes/note_04_after_diary.txt?raw';
import note05 from '../data/investigation_notes/note_05_after_father_letter.txt?raw';

const NOTES = {
  'note_01_my_memories': {
    content: note01,
    title: '我的回忆.txt',
    fileName: '我的回忆.txt'
  },
  'note_02_after_album': {
    content: note02,
    title: '调查笔记-01.txt',
    fileName: '调查笔记-01.txt'
  },
  'note_03_after_father_log_1': {
    content: note03,
    title: '调查笔记-02.txt',
    fileName: '调查笔记-02.txt'
  },
  'note_04_after_diary': {
    content: note04,
    title: '调查笔记-03.txt',
    fileName: '调查笔记-03.txt'
  },
  'note_05_after_father_letter': {
    content: note05,
    title: '调查笔记-04.txt',
    fileName: '调查笔记-04.txt'
  }
};

export const useInvestigationNotes = () => {
  const { progress, hasShownNote, addInvestigationNote } = useUserProgress();
  const { openWindow } = useWindowManager();
  const { fs, setFs } = useFileSystem();

  const triggerNote = (noteId) => {
    if (hasShownNote(noteId)) {
      return; // Already shown
    }

    const noteData = NOTES[noteId];
    if (!noteData) {
      console.error(`Note ${noteId} not found`);
      return;
    }

    // Mark as shown
    addInvestigationNote(noteId, noteData.content);

    // Open auto-typing notepad window
    const handleTypingComplete = (content) => {
      // Save to desktop in filesystem
      // This will be handled by the FileSystemContext update
      console.log('Typing complete, saving to desktop:', noteData.fileName);
    };

    openWindow(
      `investigation-note-${noteId}`,
      noteData.title,
      <AutoTypingNotepad
        content={noteData.content}
        typingSpeed={20} // 50 chars/second = 20ms per char
        onTypingComplete={handleTypingComplete}
      />,
      'notepad',
      { width: 600, height: 400 }
    );
  };

  // Trigger note 1: After first QQ login
  useEffect(() => {
    if (progress.qqLoggedIn && !hasShownNote('note_01_my_memories')) {
      setTimeout(() => triggerNote('note_01_my_memories'), 2000);
    }
  }, [progress.qqLoggedIn]);

  // Trigger note 2: After album unlocked
  useEffect(() => {
    if (progress.albumUnlocked && !hasShownNote('note_02_after_album')) {
      setTimeout(() => triggerNote('note_02_after_album'), 2000);
    }
  }, [progress.albumUnlocked]);

  // Trigger note 3: After father's first layer log unlocked
  useEffect(() => {
    if (progress.fatherLogLayer1Unlocked && !hasShownNote('note_03_after_father_log_1')) {
      setTimeout(() => triggerNote('note_03_after_father_log_1'), 2000);
    }
  }, [progress.fatherLogLayer1Unlocked]);

  // Trigger note 4: After encrypted diary unlocked
  useEffect(() => {
    if (progress.encryptedDiaryUnlocked && !hasShownNote('note_04_after_diary')) {
      setTimeout(() => triggerNote('note_04_after_diary'), 2000);
    }
  }, [progress.encryptedDiaryUnlocked]);

  // Trigger note 5: After father's letter (second layer log) unlocked
  useEffect(() => {
    if (progress.fatherLogLayer2Unlocked && !hasShownNote('note_05_after_father_letter')) {
      setTimeout(() => triggerNote('note_05_after_father_letter'), 2000);
    }
  }, [progress.fatherLogLayer2Unlocked]);

  return { triggerNote };
};
