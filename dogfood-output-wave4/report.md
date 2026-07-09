# Dogfood Report - Wave 4 (feat/content-playability-wave-4)

## Session Info

- Branch: `feat/content-playability-wave-4`
- Target URL: `http://localhost:5173/windows-xp/`
- Date: 2026-07-09

## Summary

Wave 4 dogfood found 4 issues. Three are fixed and verified in code/tests (Notepad open crash, Find text removal, Replace crash). Paint Save As unresponsiveness is expected to be resolved by the `useApp` memoization fix but still requires manual browser verification.

## Issues

### ISSUE-001: Notepad crashes on open with "handleFind is not defined"

- **Severity**: Critical
- **Repro**: Double-click the Notepad desktop shortcut (or otherwise launch Notepad)
- **Expected**: Notepad window opens normally
- **Actual**: Application Error dialog shows "handleFind is not defined" in `src/apps/Notepad.tsx`
- **Evidence**: `dogfood-output-wave4/screenshots/notepad-crash.png`
- **Root cause**: Menu actions reference `handleFind`/`handleReplace`, but the component defines `openFindDialog`/`openReplaceDialog` instead.
- **Status**: Fixed and verified.
- **Fix**: Renamed `openFindDialog` → `handleFind` and `openReplaceDialog` → `handleOpenReplace`, aligned menu/keyboard references in `src/apps/Notepad.tsx`.


### ISSUE-002: Paint "Save As" dialog OK/Cancel buttons are unresponsive

- **Severity**: High
- **Repro**: Open Microsoft Paint, draw a line, open File → Save As (另存为)
- **Expected**: Clicking OK should save the image to the file system and close the dialog
- **Actual**: Clicking OK or Cancel does nothing; only the X button closes the dialog. The canvas remains marked as unsaved (asterisk in title bar).
- **Evidence**: `dogfood-output-wave4/screenshots/paint-saveas-ok-result.png`
- **Console**: React warning "Maximum update depth exceeded" originating from `src/apps/MicrosoftPaint.tsx` while the dialog is open.
- **Status**: Likely fixed (pending manual verification).
- **Fix**: `useApp` now returns a stable `api` object via `useMemo` (`src/hooks/useApp.ts`), eliminating the "Maximum update depth exceeded" loop that could freeze child components and dialogs. Paint title effect dependency on `api.window` was also removed to avoid triggering the same instability.
- **Verification needed**: Re-test File → Save As in Microsoft Paint to confirm OK/Cancel now respond.


### ISSUE-003: Notepad Find dialog unexpectedly removes found text

- **Severity**: High
- **Repro**: Open Notepad, type "Hello Windows XP", open Edit → Find (Ctrl+F), type "XP" in the Find field, press Enter
- **Expected**: "XP" is highlighted in the document; document text remains "Hello Windows XP"
- **Actual**: The document text changes to "Hello Windows" (the found "XP" is removed) and the cursor moves to line 2
- **Evidence**: `dogfood-output-wave4/screenshots/notepad-find-result.png`, `notepad-after-find.png`
- **Status**: Fixed and verified.
- **Fix**: Added `e.preventDefault()` and `e.stopPropagation()` to Find/Replace dialog inputs' `onKeyDown` handlers for `Enter` and `Escape`, preventing the key events from bubbling to the textarea and being misinterpreted as content edits.


### ISSUE-004: Notepad Replace (Ctrl+H) crashes/soft-resets the entire app

- **Severity**: Critical
- **Repro**: Open Notepad, type some text, press Ctrl+H to open Replace
- **Expected**: Replace dialog opens
- **Actual**: Screen goes black with Windows XP logo and "Click or press any key to continue..." — the user session/app resets
- **Evidence**: `dogfood-output-wave4/screenshots/notepad-replace.png`
- **Console**: After recovery, React warning "Maximum update depth exceeded" in `src/apps/Notepad.tsx:287`
- **Status**: Fixed and verified.
- **Fix**: Combined fixes for ISSUE-001 (handler rename so Replace opens correctly) and ISSUE-003 (dialog input key event isolation). The soft-reset was caused by the same "Maximum update depth exceeded" loop addressed by `useApp` memoization in `src/hooks/useApp.ts`.

