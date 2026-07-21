import React from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { XPDialogFrame } from '../../../components/XPDialogChrome';
import { XPButton } from '../../../components/XPButton';
import {
  DialogOverlay,
  DialogContent,
  DialogRow,
  DialogLabel,
  DialogInput,
  DialogButtonArea,
} from '../styled';
import type { DialogMode } from '../types';

// Notepad Find / Replace dialogs (#163/A) — extracted from the component. Refs
// and the search-start counters stay in the parent; this renders the two modal
// portals and forwards user intent through callbacks.
export interface FindReplaceDialogProps {
  mode: DialogMode;
  onClose: () => void;
  findInputRef: React.RefObject<HTMLInputElement>;
  replaceFindInputRef: React.RefObject<HTMLInputElement>;
  findQuery: string;
  setFindQuery: (value: string) => void;
  resetFindIndex: () => void;
  replaceQuery: string;
  setReplaceQuery: (value: string) => void;
  resetReplaceIndex: () => void;
  replaceWith: string;
  setReplaceWith: (value: string) => void;
  onFindNext: () => void;
  onReplaceFindNext: () => void;
  onReplace: () => void;
  onReplaceAll: () => void;
}

const FindReplaceDialog: React.FC<FindReplaceDialogProps> = ({
  mode,
  onClose,
  findInputRef,
  replaceFindInputRef,
  findQuery,
  setFindQuery,
  resetFindIndex,
  replaceQuery,
  setReplaceQuery,
  resetReplaceIndex,
  replaceWith,
  setReplaceWith,
  onFindNext,
  onReplaceFindNext,
  onReplace,
  onReplaceAll,
}) => {
  const { t } = useTranslation();

  if (mode === 'find') {
    return createPortal(
      <DialogOverlay className="windows-xp-portal" onMouseDown={e => e.stopPropagation()}>
        <XPDialogFrame title={t('notepad.find.title')} onClose={onClose} width={340}>
          <DialogContent>
            <DialogRow>
              <DialogLabel>{t('notepad.find.findWhat')}</DialogLabel>
              <DialogInput
                ref={findInputRef}
                value={findQuery}
                onChange={e => {
                  setFindQuery(e.target.value);
                  resetFindIndex();
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                    onFindNext();
                  }
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    onClose();
                  }
                }}
              />
            </DialogRow>
          </DialogContent>
          <DialogButtonArea>
            <XPButton onClick={onFindNext} disabled={!findQuery}>
              {t('notepad.find.findNext')}
            </XPButton>
            <XPButton onClick={onClose}>{t('common.cancel')}</XPButton>
          </DialogButtonArea>
        </XPDialogFrame>
      </DialogOverlay>,
      document.body
    );
  }

  if (mode === 'replace') {
    return createPortal(
      <DialogOverlay className="windows-xp-portal" onMouseDown={e => e.stopPropagation()}>
        <XPDialogFrame title={t('notepad.replace.title')} onClose={onClose} width={360}>
          <DialogContent>
            <DialogRow>
              <DialogLabel>{t('notepad.replace.findWhat')}</DialogLabel>
              <DialogInput
                ref={replaceFindInputRef}
                value={replaceQuery}
                onChange={e => {
                  setReplaceQuery(e.target.value);
                  resetReplaceIndex();
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                    onReplaceFindNext();
                  }
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    onClose();
                  }
                }}
              />
            </DialogRow>
            <DialogRow>
              <DialogLabel>{t('notepad.replace.replaceWith')}</DialogLabel>
              <DialogInput
                value={replaceWith}
                onChange={e => setReplaceWith(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    onClose();
                  }
                }}
              />
            </DialogRow>
          </DialogContent>
          <DialogButtonArea>
            <XPButton onClick={onReplaceFindNext} disabled={!replaceQuery}>
              {t('notepad.find.findNext')}
            </XPButton>
            <XPButton onClick={onReplace} disabled={!replaceQuery}>
              {t('notepad.replace.replace')}
            </XPButton>
            <XPButton
              onClick={onReplaceAll}
              disabled={!replaceQuery || replaceQuery === replaceWith}
            >
              {t('notepad.replace.replaceAll')}
            </XPButton>
            <XPButton onClick={onClose}>{t('common.cancel')}</XPButton>
          </DialogButtonArea>
        </XPDialogFrame>
      </DialogOverlay>,
      document.body
    );
  }

  return null;
};

export default FindReplaceDialog;
