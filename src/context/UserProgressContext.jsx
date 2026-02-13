import React, { createContext, useState, useContext, useEffect } from 'react';
import { useWindowManager } from './WindowManagerContext';
import AutoTypingNotepad from '../apps/AutoTypingNotepad';

export const UserProgressContext = createContext();

export const useUserProgress = () => useContext(UserProgressContext);

export const UserProgressProvider = ({ children }) => {
  const { openWindow } = useWindowManager();
  const [progress, setProgress] = useState(() => {
    try {
      const saved = localStorage.getItem('xp_game_progress');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to load progress:", e);
    }
    return {
      firstLogin: true,
      stickyNoteRead: false,
      qqLoggedIn: false,
      albumUnlocked: false,
      fatherLogLayer1Unlocked: false,
      encryptedDiaryUnlocked: false,
      fatherLogLayer2Unlocked: false,
      reportRead: false,
      gameCompleted: false,
      investigationNotes: [],
      puzzleAttempts: {}, // 记录每个谜题的尝试次数 { puzzleId: count }
      emailTimestamps: {}, // 记录每个邮件触发的时间 { emailId: timestamp }
      emailSent: [], // 记录已发送的邮件ID
      emailRead: [] // 记录已读的邮件ID
    };
  });

  // 持久化进度
  useEffect(() => {
    localStorage.setItem('xp_game_progress', JSON.stringify(progress));
  }, [progress]);

  const markStickyNoteRead = () => {
    setProgress(prev => ({ ...prev, stickyNoteRead: true, firstLogin: false }));
  };

  const markQqLoggedIn = () => {
    setProgress(prev => ({ ...prev, qqLoggedIn: true }));
  };

  const resetQqLogin = () => {
    setProgress(prev => ({ ...prev, qqLoggedIn: false }));
  };

  const markAlbumUnlocked = () => {
    setProgress(prev => ({ ...prev, albumUnlocked: true }));
  };

  const markFatherLogLayer1Unlocked = () => {
    setProgress(prev => ({ ...prev, fatherLogLayer1Unlocked: true }));
  };

  const markEncryptedDiaryUnlocked = () => {
    setProgress(prev => ({ ...prev, encryptedDiaryUnlocked: true }));
  };

  const markFatherLogLayer2Unlocked = () => {
    setProgress(prev => ({ ...prev, fatherLogLayer2Unlocked: true }));
  };

  const markReportRead = () => {
    setProgress(prev => ({ ...prev, reportRead: true }));
  };

  const markGameCompleted = () => {
    setProgress(prev => ({ ...prev, gameCompleted: true }));
  };

  const addInvestigationNote = (noteId, content) => {
    // 检查是否已存在相同ID的笔记，避免重复添加
    if (progress.investigationNotes.some(note => note.id === noteId)) {
      return;
    }

    setProgress(prev => ({
      ...prev,
      investigationNotes: [...prev.investigationNotes, { id: noteId, content, time: new Date().toISOString() }]
    }));

    // 自动打开调查笔记窗口，使用自动打字效果
    setTimeout(() => {
      openWindow(
        `investigation-note-${noteId}`,
        '调查笔记',
        <AutoTypingNotepad content={content} />,
        'notepad',
        { width: 500, height: 400 }
      );
    }, 1000);
  };

  const hasShownNote = (noteId) => {
    return progress.investigationNotes.some(note => note.id === noteId);
  };

  const recordPuzzleAttempt = (puzzleId) => {
    setProgress(prev => ({
      ...prev,
      puzzleAttempts: {
        ...prev.puzzleAttempts,
        [puzzleId]: (prev.puzzleAttempts[puzzleId] || 0) + 1
      }
    }));
  };

  const getPuzzleAttempts = (puzzleId) => {
    return progress.puzzleAttempts[puzzleId] || 0;
  };

  const resetPuzzleAttempts = (puzzleId) => {
    setProgress(prev => ({
      ...prev,
      puzzleAttempts: {
        ...prev.puzzleAttempts,
        [puzzleId]: 0
      }
    }));
  };

  // 记录邮件触发时间
  const recordEmailTrigger = (emailId) => {
    setProgress(prev => ({
      ...prev,
      emailTimestamps: {
        ...prev.emailTimestamps,
        [emailId]: Date.now()
      }
    }));
  };

  // 标记邮件已发送
  const markEmailSent = (emailId) => {
    setProgress(prev => ({
      ...prev,
      emailSent: [...prev.emailSent, emailId]
    }));
  };

  // 标记邮件已读
  const markEmailRead = (emailId) => {
    setProgress(prev => ({
      ...prev,
      emailRead: [...prev.emailRead, emailId]
    }));
  };

  const resetProgress = () => {
    localStorage.removeItem('xp_game_progress');
    setProgress({
      firstLogin: true,
      stickyNoteRead: false,
      qqLoggedIn: false,
      albumUnlocked: false,
      fatherLogLayer1Unlocked: false,
      encryptedDiaryUnlocked: false,
      fatherLogLayer2Unlocked: false,
      reportRead: false,
      gameCompleted: false,
      investigationNotes: [],
      puzzleAttempts: {},
      emailTimestamps: {},
      emailSent: [],
      emailRead: []
    });
  };

  return (
    <UserProgressContext.Provider value={{
      progress,
      markStickyNoteRead,
      markQqLoggedIn,
      resetQqLogin,
      markAlbumUnlocked,
      markFatherLogLayer1Unlocked,
      markEncryptedDiaryUnlocked,
      markFatherLogLayer2Unlocked,
      markReportRead,
      markGameCompleted,
      addInvestigationNote,
      hasShownNote,
      recordPuzzleAttempt,
      getPuzzleAttempts,
      resetPuzzleAttempts,
      recordEmailTrigger,
      markEmailSent,
      markEmailRead,
      resetProgress
    }}>
      {children}
    </UserProgressContext.Provider>
  );
};
