import React, { useId, useState } from 'react';
import styled from 'styled-components';
import { resolveOSTheme } from '../themes/useOSTheme';

/**
 * XP tab control (#78): the classic raised tab strip with a bordered panel.
 * Controlled (`activeId` + `onChange`) or uncontrolled (`defaultActiveId`).
 */

const Strip = styled.div`
  display: flex;
  gap: 2px;
  padding-left: 3px;
  position: relative;
  z-index: 1;
`;

const Tab = styled.button<{ $active?: boolean }>`
  font-family: ${({ theme }) => resolveOSTheme(theme).fonts.UI};
  font-size: 11px;
  color: ${({ theme }) => resolveOSTheme(theme).tokens.BLACK};
  padding: 3px 9px ${p => (p.$active ? '4px' : '3px')};
  margin-bottom: ${p => (p.$active ? '-1px' : '0')};
  background: ${({ theme }) => resolveOSTheme(theme).tokens.SURFACE};
  border: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.DIVIDER_GREY};
  border-bottom: ${p =>
    p.$active
      ? `1px solid ${resolveOSTheme(p.theme).tokens.SURFACE}`
      : `1px solid ${resolveOSTheme(p.theme).tokens.DIVIDER_GREY}`};
  border-radius: 3px 3px 0 0;
  cursor: pointer;
  position: relative;
  top: ${p => (p.$active ? '0' : '1px')};
`;

const Panel = styled.div`
  border: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.DIVIDER_GREY};
  background: ${({ theme }) => resolveOSTheme(theme).tokens.SURFACE};
  padding: 12px;
  font-family: ${({ theme }) => resolveOSTheme(theme).fonts.UI};
  font-size: 11px;
  color: ${({ theme }) => resolveOSTheme(theme).tokens.BLACK};
`;

export interface XPTab {
  id: string;
  label: React.ReactNode;
  content: React.ReactNode;
}

export interface XPTabsProps {
  tabs: XPTab[];
  activeId?: string;
  defaultActiveId?: string;
  onChange?: (id: string) => void;
  className?: string;
}

export const XPTabs: React.FC<XPTabsProps> = ({
  tabs,
  activeId,
  defaultActiveId,
  onChange,
  className,
}) => {
  const groupId = useId();
  const [internal, setInternal] = useState(defaultActiveId ?? tabs[0]?.id);
  const active = activeId ?? internal;

  const select = (id: string) => {
    if (activeId === undefined) setInternal(id);
    onChange?.(id);
  };

  const current = tabs.find(tterm => tterm.id === active) ?? tabs[0];

  return (
    <div className={className}>
      <Strip role="tablist">
        {tabs.map(tab => (
          <Tab
            key={tab.id}
            role="tab"
            id={`${groupId}-tab-${tab.id}`}
            aria-selected={tab.id === active}
            $active={tab.id === active}
            onClick={() => select(tab.id)}
          >
            {tab.label}
          </Tab>
        ))}
      </Strip>
      <Panel role="tabpanel">{current?.content}</Panel>
    </div>
  );
};
