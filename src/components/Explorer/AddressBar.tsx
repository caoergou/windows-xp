import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import XPIcon from '../XPIcon';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS } from '../../constants';

const Bar = styled.div`
  flex-shrink: 0;
  border-top: 1px solid rgba(255, 255, 255, 0.7);
  height: 22px;
  font-size: 11px;
  display: flex;
  align-items: center;
  padding: 0 2px 1px;
  box-shadow: inset 0 -2px 3px -1px #b0b0b0;
  background: ${COLORS.TOOLBAR_GRADIENT};
`;

const Label = styled.span`
  line-height: 100%;
  color: rgba(0, 0, 0, 0.5);
  padding: 5px;
  font-size: 11px;
  font-family: ${FONTS.UI};
  white-space: nowrap;
  flex-shrink: 0;
`;

const InputWrapper = styled.div`
  border: rgba(122, 122, 255, 0.6) 1px solid;
  height: 100%;
  display: flex;
  flex: 1;
  align-items: center;
  background-color: white;
  position: relative;
`;

const Input = styled.input`
  white-space: nowrap;
  position: absolute;
  white-space: nowrap;
  left: 16px;
  right: 17px;
  height: 100%;
  padding: 0 2px;
  font-size: 11px;
  font-family: ${FONTS.UI};
  background: white;
  border: none;
  outline: none;
  overflow: hidden;
`;

const IconWrapper = styled.div`
  width: 14px;
  height: 14px;
  margin-left: 2px;
`;

const DropArrow = styled.div`
  width: 15px;
  height: 15px;
  right: 1px;
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  &:hover {
    filter: brightness(1.1);
  }
`;

const GoIcon = styled.span`
  display: inline-flex;
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;

  img {
    width: 14px;
    height: 14px;
    display: block;
  }
`;

const HistoryMenu = styled.ul`
  position: absolute;
  top: 100%;
  left: -1px;
  right: -1px;
  margin: 0;
  padding: 1px;
  list-style: none;
  background: ${COLORS.WHITE};
  border: 1px solid ${COLORS.FIELD_BORDER};
  box-shadow: 2px 2px 3px rgba(0, 0, 0, 0.3);
  max-height: 200px;
  overflow-y: auto;
  z-index: 4000;
`;

const HistoryItem = styled.li`
  display: flex;
  align-items: center;
  gap: 5px;
  height: 18px;
  padding: 0 6px;
  font-size: 11px;
  font-family: ${FONTS.UI};
  white-space: nowrap;
  cursor: pointer;
  color: ${COLORS.BLACK};

  &:hover,
  &[data-active='true'] {
    background: #316ac5;
    color: ${COLORS.WHITE};
  }
`;

const HistoryEmpty = styled.li`
  padding: 3px 8px;
  font-size: 11px;
  color: ${COLORS.GREY_88};
  font-family: ${FONTS.UI};
`;

const GoButton = styled.button`
  display: flex;
  align-items: center;
  padding: 0 6px 0 2px;
  height: auto;
  min-height: 0;
  position: relative;
  background: transparent !important;
  border: none !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  cursor: pointer;
  font-size: 11px;
  font-family: ${FONTS.UI};
  gap: 2px;
  line-height: 1;

  &:hover {
    filter: brightness(1.08);
  }

  &:active {
    filter: brightness(0.92);
  }
`;

/** A visited location for the address-bar history dropdown (#120, EXP-08). */
export interface AddressHistoryEntry {
  label: string;
  path: string[];
}

interface AddressBarProps {
  address: string;
  onAddressChange?: (address: string) => void;
  onGo?: () => void;
  /** Recently visited locations (most-recent first) for the dropdown. */
  history?: AddressHistoryEntry[];
  /** Navigate to a picked history entry. */
  onSelectHistory?: (path: string[]) => void;
}

const AddressBar: React.FC<AddressBarProps> = ({
  address,
  onAddressChange,
  onGo,
  history = [],
  onSelectHistory,
}) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close the dropdown on an outside click.
  useEffect(() => {
    if (!open) return undefined;
    const handle = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  const pick = (entry: AddressHistoryEntry) => {
    setOpen(false);
    setActiveIndex(-1);
    onSelectHistory?.(entry.path);
  };

  const onListKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, history.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && activeIndex >= 0 && history[activeIndex]) {
      e.preventDefault();
      pick(history[activeIndex]);
    }
  };

  return (
    <Bar>
      <Label>{t('explorer.address')}</Label>
      <InputWrapper ref={wrapRef}>
        <IconWrapper>
          <XPIcon name="folder" size={14} />
        </IconWrapper>
        <Input
          type="text"
          value={address}
          onChange={e => onAddressChange?.(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onGo?.()}
        />
        <DropArrow
          role="button"
          aria-label={t('explorer.address')}
          aria-haspopup="listbox"
          aria-expanded={open}
          data-testid="address-history-toggle"
          onClick={() => {
            setActiveIndex(-1);
            setOpen(o => !o);
          }}
        >
          <XPIcon name="dropdown" size={15} />
        </DropArrow>
        {open && (
          <HistoryMenu role="listbox" data-testid="address-history-menu" onKeyDown={onListKeyDown}>
            {history.length === 0 ? (
              <HistoryEmpty>—</HistoryEmpty>
            ) : (
              history.map((entry, i) => (
                <HistoryItem
                  key={entry.path.join('\\') || 'root'}
                  role="option"
                  aria-selected={i === activeIndex}
                  data-active={i === activeIndex}
                  data-testid={`address-history-item-${i}`}
                  tabIndex={0}
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => pick(entry)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') pick(entry);
                  }}
                >
                  <XPIcon name="folder" size={14} />
                  <span>{entry.label}</span>
                </HistoryItem>
              ))
            )}
          </HistoryMenu>
        )}
      </InputWrapper>
      <GoButton onClick={onGo}>
        <GoIcon>
          <XPIcon name="go" size={14} />
        </GoIcon>
        <span>{t('internetExplorer.addressBar.go')}</span>
      </GoButton>
    </Bar>
  );
};

export default AddressBar;
