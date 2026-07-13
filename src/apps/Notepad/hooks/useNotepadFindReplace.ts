// Notepad Find / Replace (#163/A). The search feature — its own dialog state,
// query/refs, and the find-next / replace / replace-all handlers — operates on
// a small editor handle the host hook passes in (content + the mutation
// primitives). Extracted verbatim from useNotepad; no behavior change, including
// the case-insensitive match/replace semantics (#172).
import { useState, useRef } from 'react';
import type { TFunction } from 'i18next';
import { useApp } from '../../../hooks/useApp';
import { findNextIndex, countOccurrences, replaceAll, equalsIgnoreCase } from '../logic';
import type { DialogMode, HistoryState } from '../types';

/** The slice of the editor the search feature needs to read and mutate. */
export interface NotepadEditorHandle {
  content: string;
  setContent: (value: string) => void;
  setIsModified: (value: boolean) => void;
  pushHistory: () => void;
  editorStateRef: React.MutableRefObject<HistoryState>;
  setTextareaSelection: (start: number, end: number) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
}

interface UseNotepadFindReplaceArgs {
  editor: NotepadEditorHandle;
  api: ReturnType<typeof useApp>;
  t: TFunction;
  setDialogMode: (mode: DialogMode) => void;
}

export function useNotepadFindReplace({
  editor,
  api,
  t,
  setDialogMode,
}: UseNotepadFindReplaceArgs) {
  const {
    content,
    setContent,
    setIsModified,
    pushHistory,
    editorStateRef,
    setTextareaSelection,
    textareaRef,
  } = editor;

  const [findQuery, setFindQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [replaceWith, setReplaceWith] = useState('');
  const findStartIndexRef = useRef(0);
  const replaceStartIndexRef = useRef(0);
  const findInputRef = useRef<HTMLInputElement>(null);
  const replaceFindInputRef = useRef<HTMLInputElement>(null);

  const handleFind = () => {
    const ta = textareaRef.current;
    const selected = ta ? ta.value.substring(ta.selectionStart, ta.selectionEnd) : '';
    setFindQuery(selected || findQuery);
    findStartIndexRef.current = ta ? ta.selectionEnd : 0;
    setDialogMode('find');
    setTimeout(() => findInputRef.current?.focus(), 0);
  };

  const handleOpenReplace = () => {
    const ta = textareaRef.current;
    const selected = ta ? ta.value.substring(ta.selectionStart, ta.selectionEnd) : '';
    setReplaceQuery(selected || replaceQuery);
    replaceStartIndexRef.current = ta ? ta.selectionEnd : 0;
    setDialogMode('replace');
    setTimeout(() => replaceFindInputRef.current?.focus(), 0);
  };

  const findNext = (query: string, startIndexRef: React.MutableRefObject<number>): boolean => {
    if (!query) return false;
    const idx = findNextIndex(content, query, startIndexRef.current);
    if (idx !== -1) {
      setTextareaSelection(idx, idx + query.length);
      startIndexRef.current = idx + query.length;
      textareaRef.current?.focus();
      return true;
    }
    return false;
  };

  const handleFindNext = () => {
    if (!findNext(findQuery, findStartIndexRef)) {
      api.dialog.alert({
        title: t('notepad.find.title'),
        message: t('notepad.find.notFound', { query: findQuery }),
        type: 'info',
      });
    }
  };

  const handleReplaceFindNext = () => {
    if (!findNext(replaceQuery, replaceStartIndexRef)) {
      api.dialog.alert({
        title: t('notepad.replace.title'),
        message: t('notepad.find.notFound', { query: replaceQuery }),
        type: 'info',
      });
    }
  };

  const handleReplace = () => {
    const ta = textareaRef.current;
    if (!ta || !replaceQuery) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = content.substring(start, end);
    if (equalsIgnoreCase(selected, replaceQuery)) {
      const newValue = content.substring(0, start) + replaceWith + content.substring(end);
      pushHistory();
      setContent(newValue);
      setIsModified(true);
      const newCursor = start + replaceWith.length;
      editorStateRef.current = {
        content: newValue,
        selectionStart: newCursor,
        selectionEnd: newCursor,
      };
      replaceStartIndexRef.current = newCursor;
      setTimeout(() => {
        setTextareaSelection(newCursor, newCursor);
        ta.focus();
      }, 0);
    }
    handleReplaceFindNext();
  };

  const handleReplaceAll = () => {
    if (!replaceQuery || replaceQuery === replaceWith) return;
    const count = countOccurrences(content, replaceQuery);
    if (count <= 0) {
      api.dialog.alert({
        title: t('notepad.replace.title'),
        message: t('notepad.find.notFound', { query: replaceQuery }),
        type: 'info',
      });
      return;
    }
    const newValue = replaceAll(content, replaceQuery, replaceWith);
    pushHistory();
    setContent(newValue);
    setIsModified(true);
    editorStateRef.current = { content: newValue, selectionStart: 0, selectionEnd: 0 };
    replaceStartIndexRef.current = 0;
    setTimeout(() => {
      setTextareaSelection(0, 0);
      textareaRef.current?.focus();
    }, 0);
    api.dialog.alert({
      title: t('notepad.replace.title'),
      message: t('notepad.replace.replacedCount', { count }),
      type: 'info',
    });
  };

  return {
    findQuery,
    setFindQuery,
    replaceQuery,
    setReplaceQuery,
    replaceWith,
    setReplaceWith,
    findInputRef,
    replaceFindInputRef,
    findStartIndexRef,
    replaceStartIndexRef,
    handleFind,
    handleOpenReplace,
    handleFindNext,
    handleReplaceFindNext,
    handleReplace,
    handleReplaceAll,
  };
}
