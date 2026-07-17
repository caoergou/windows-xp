import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { CultureAppShell } from './culture/shell';
import { useTranslation } from 'react-i18next';
import XPIcon from '../components/XPIcon';

/* brand-palette:start — centrally declared app-identity colours (#213 batch 4).
   Exempt from the guard:purity hex ratchet; NOT COLORS tokens on purpose: this
   app keeps its own period look even if the OS theme is swapped (#143). */
const PALETTE = {
  blue700: '#004488',
  blue7002: '#0055AA',
  blue600: '#0066CC',
  blue500: '#0088FF',
  grey800: '#333333',
  blue7003: '#335577',
  blue7004: '#445566',
  blue400: '#4A9EFF',
  green500: '#55AA55',
  blue300: '#66BBFF',
  green300: '#88CC88',
  grey400: '#999999',
  grey300: '#BBBBBB',
  blue100: '#C7D8EB',
  orange600: '#CC5500',
  red400: '#CC5555',
  orange6002: '#CC6600',
  blue1002: '#CCE4FF',
  grey200: '#D0D0D0',
  blue1003: '#DCE6F2',
  grey100: '#E0E0E0',
  blue1004: '#E3EEF9',
  orange500: '#E66B00',
  grey1002: '#E8E8E8',
  grey1003: '#EBEBEB',
  blue1005: '#EEF2F5',
  blue1006: '#EEF3F9',
  white: '#F0F0F0',
  blue1007: '#F0F5FA',
  white2: '#F7F7F7',
  blue1008: '#F7FBFF',
  blue1009: '#F9FBFD',
  orange5002: '#FF8800',
  orange400: '#FF9933',
  red200: '#FF9999',
  orange4002: '#FFAA33',
  orange300: '#FFB84D',
  yellow500: '#FFCC00',
  yellow300: '#FFCC66',
  yellow3002: '#FFD67A',
  orange100: '#FFE8CC',
  orange1002: '#FFF3E0',
  white3: '#FFFFFF',
};
/* brand-palette:end */

interface DownloadItem {
  id: string;
  name: string;
  size: string;
  progress: number;
  speed: string;
  status: 'waiting' | 'downloading' | 'paused' | 'completed' | 'error';
}

const Wrap = styled(CultureAppShell)`
  background: ${PALETTE.white2};
  color: ${PALETTE.grey800};
`;

const Header = styled.div`
  background: linear-gradient(
    to bottom,
    ${PALETTE.blue400} 0%,
    ${PALETTE.blue600} 50%,
    ${PALETTE.blue7002} 100%
  );
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid ${PALETTE.blue700};
  flex-shrink: 0;
`;

const LogoBox = styled.div`
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, ${PALETTE.yellow500} 0%, ${PALETTE.orange5002} 100%);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.4),
    0 2px 4px rgba(0, 0, 0, 0.3);
  flex-shrink: 0;
`;

const LogoIcon = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
    <path
      d="M20 3L10 16h5l-3 9 10-12h-5l4-10z"
      fill={PALETTE.white3}
      stroke={PALETTE.orange600}
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
  </svg>
);

const HeaderText = styled.div`
  color: white;
  line-height: 1.3;

  .title {
    font-size: 18px;
    font-weight: bold;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.4);
  }

  .version {
    font-size: 11px;
    color: ${PALETTE.blue1002};
  }
`;

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: linear-gradient(to bottom, ${PALETTE.white3} 0%, ${PALETTE.blue1006} 100%);
  border-bottom: 1px solid ${PALETTE.blue100};
  flex-shrink: 0;
`;

const ToolbarBtn = styled.button<{ $primary?: boolean }>`
  height: 24px;
  padding: 0 10px;
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  border: 1px solid;
  border-radius: 2px;
  display: flex;
  align-items: center;
  gap: 4px;

  ${p =>
    p.$primary
      ? `
    background: linear-gradient(to bottom, ${PALETTE.yellow300} 0%, ${PALETTE.orange4002} 50%, ${PALETTE.orange5002} 100%);
    color: ${PALETTE.white3};
    border-color: ${PALETTE.orange6002};
    text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.3);

    &:hover {
      background: linear-gradient(to bottom, ${PALETTE.yellow3002} 0%, ${PALETTE.orange300} 50%, ${PALETTE.orange400} 100%);
    }
    &:active {
      background: linear-gradient(to bottom, ${PALETTE.orange5002} 0%, ${PALETTE.orange500} 100%);
      box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.3);
    }
  `
      : `
    background: linear-gradient(to bottom, ${PALETTE.white3} 0%, ${PALETTE.white} 50%, ${PALETTE.grey100} 100%);
    color: ${PALETTE.grey800};
    border-color: ${PALETTE.grey400};

    &:hover {
      background: linear-gradient(to bottom, ${PALETTE.white3} 0%, ${PALETTE.white2} 50%, ${PALETTE.grey1003} 100%);
    }
    &:active {
      background: linear-gradient(to bottom, ${PALETTE.grey100} 0%, ${PALETTE.grey200} 100%);
      box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.2);
    }
  `}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Main = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background: ${PALETTE.white3};
  overflow: hidden;
`;

const ListHeader = styled.div`
  display: flex;
  align-items: center;
  padding: 5px 10px;
  background: linear-gradient(to bottom, ${PALETTE.blue1008} 0%, ${PALETTE.blue1004} 100%);
  border-bottom: 1px solid ${PALETTE.blue100};
  color: ${PALETTE.blue7003};
  font-weight: bold;
  flex-shrink: 0;
`;

const ListBody = styled.div`
  flex: 1;
  overflow-y: auto;
  background: ${PALETTE.white3};
`;

const ListRow = styled.div<{ $selected?: boolean }>`
  display: flex;
  align-items: center;
  padding: 7px 10px;
  border-bottom: 1px solid ${PALETTE.blue1005};
  cursor: pointer;
  background: ${p => (p.$selected ? PALETTE.orange1002 : 'transparent')};

  &:hover {
    background: ${p => (p.$selected ? PALETTE.orange100 : PALETTE.blue1009)};
  }
`;

const Cell = styled.div<{ $flex?: number; $width?: number; $align?: 'left' | 'center' | 'right' }>`
  flex: ${p => p.$flex ?? 1};
  width: ${p => (p.$width ? `${p.$width}px` : 'auto')};
  text-align: ${p => p.$align ?? 'left'};
  padding: 0 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ProgressWrap = styled.div`
  width: 100%;
  height: 14px;
  background: ${PALETTE.grey1002};
  border: 1px solid ${PALETTE.grey300};
  border-radius: 2px;
  overflow: hidden;
  position: relative;
`;

const ProgressFill = styled.div<{ $value: number; $status: DownloadItem['status'] }>`
  width: ${p => p.$value}%;
  height: 100%;
  background: ${p =>
    p.$status === 'completed'
      ? `linear-gradient(to bottom, ${PALETTE.green300} 0%, ${PALETTE.green500} 100%)`
      : p.$status === 'error'
        ? `linear-gradient(to bottom, ${PALETTE.red200} 0%, ${PALETTE.red400} 100%)`
        : `linear-gradient(to bottom, ${PALETTE.blue300} 0%, ${PALETTE.blue500} 100%)`};
  transition: width 0.2s linear;
`;

const ProgressText = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: ${PALETTE.grey800};
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.6);
`;

const EmptyState = styled.div`
  padding: 30px;
  text-align: center;
  color: ${PALETTE.grey400};
`;

const StatusBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 10px;
  background: linear-gradient(to bottom, ${PALETTE.blue1007} 0%, ${PALETTE.blue1003} 100%);
  border-top: 1px solid ${PALETTE.blue100};
  font-size: 11px;
  color: ${PALETTE.blue7004};
  flex-shrink: 0;
`;

const StatusMetric = styled.span`
  color: ${PALETTE.blue600};
  font-weight: bold;
`;

const StatusBadge = styled.span<{ $status: DownloadItem['status'] }>`
  display: inline-block;
  padding: 1px 6px;
  border-radius: 2px;
  font-size: 11px;
  color: ${PALETTE.white3};
  background: ${p =>
    p.$status === 'completed'
      ? PALETTE.green500
      : p.$status === 'downloading'
        ? PALETTE.blue500
        : p.$status === 'paused'
          ? PALETTE.orange4002
          : p.$status === 'error'
            ? PALETTE.red400
            : PALETTE.grey400};
`;

const defaultDownloads: DownloadItem[] = [
  {
    id: '1',
    name: '暴风影音.exe',
    size: '28.5 MB',
    progress: 100,
    speed: '0 KB/s',
    status: 'completed',
  },
  {
    id: '2',
    name: 'QQ2007.exe',
    size: '18.2 MB',
    progress: 62,
    speed: '156 KB/s',
    status: 'downloading',
  },
  {
    id: '3',
    name: '魔兽争霸3.mpq',
    size: '512 MB',
    progress: 24,
    speed: '128 KB/s',
    status: 'downloading',
  },
  {
    id: '4',
    name: '卡巴斯基2009.exe',
    size: '42.0 MB',
    progress: 0,
    speed: '0 KB/s',
    status: 'waiting',
  },
];

interface ThunderProps {
  windowId?: string;
}

const Thunder: React.FC<ThunderProps> = () => {
  const { t } = useTranslation();
  const [items, setItems] = useState<DownloadItem[]>(defaultDownloads);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const intervalsRef = useRef<Record<string, number>>({});

  const selectedItem = useMemo(
    () => items.find(item => item.id === selectedId) || null,
    [items, selectedId]
  );

  const totalSpeed = useMemo(() => {
    const downloading = items.filter(item => item.status === 'downloading');
    if (downloading.length === 0) return '0 KB/s';
    const total = downloading.reduce((sum, item) => {
      const match = item.speed.match(/(\d+(?:\.\d+)?)/);
      return sum + (match ? parseFloat(match[1]) : 0);
    }, 0);
    return `${Math.round(total)} KB/s`;
  }, [items]);

  const clearDownloadInterval = useCallback((id: string) => {
    const handle = intervalsRef.current[id];
    if (handle) {
      window.clearInterval(handle);
      delete intervalsRef.current[id];
    }
  }, []);

  const startDownload = useCallback(
    (id: string) => {
      clearDownloadInterval(id);
      setItems(prev =>
        prev.map(item => (item.id === id ? { ...item, status: 'downloading' } : item))
      );

      intervalsRef.current[id] = window.setInterval(() => {
        setItems(prev =>
          prev.map(item => {
            if (item.id !== id) return item;
            if (item.status !== 'downloading') return item;
            const nextProgress = Math.min(item.progress + Math.random() * 3 + 0.5, 100);
            const nextSpeed = `${Math.floor(Math.random() * 120 + 60)} KB/s`;
            if (nextProgress >= 100) {
              clearDownloadInterval(id);
              return { ...item, progress: 100, speed: '0 KB/s', status: 'completed' };
            }
            return { ...item, progress: nextProgress, speed: nextSpeed };
          })
        );
      }, 300);
    },
    [clearDownloadInterval]
  );

  const pauseDownload = useCallback(
    (id: string) => {
      clearDownloadInterval(id);
      setItems(prev =>
        prev.map(item => (item.id === id ? { ...item, status: 'paused', speed: '0 KB/s' } : item))
      );
    },
    [clearDownloadInterval]
  );

  const deleteDownload = useCallback(
    (id: string) => {
      clearDownloadInterval(id);
      setItems(prev => prev.filter(item => item.id !== id));
      setSelectedId(prev => (prev === id ? null : prev));
    },
    [clearDownloadInterval]
  );

  const addDownload = useCallback(() => {
    const names = [
      '迅雷5安装包.exe',
      'RealPlayer10.exe',
      '千千静听.exe',
      'WinRAR.exe',
      '劲舞团客户端.exe',
    ];
    const name = names[Math.floor(Math.random() * names.length)];
    const size = `${Math.floor(Math.random() * 50 + 5)}.${Math.floor(Math.random() * 9)} MB`;
    const newItem: DownloadItem = {
      id: `${Date.now()}`,
      name,
      size,
      progress: 0,
      speed: '0 KB/s',
      status: 'waiting',
    };
    setItems(prev => [newItem, ...prev]);
    setSelectedId(newItem.id);
  }, []);

  const handleStartClick = useCallback(() => {
    if (selectedItem) {
      startDownload(selectedItem.id);
      return;
    }
    const waiting = items.find(item => item.status === 'waiting' || item.status === 'paused');
    if (waiting) {
      setSelectedId(waiting.id);
      startDownload(waiting.id);
    }
  }, [items, selectedItem, startDownload]);

  const handlePauseClick = useCallback(() => {
    if (selectedItem && selectedItem.status === 'downloading') {
      pauseDownload(selectedItem.id);
    }
  }, [selectedItem, pauseDownload]);

  const handleDeleteClick = useCallback(() => {
    if (selectedItem) {
      deleteDownload(selectedItem.id);
    }
  }, [selectedItem, deleteDownload]);

  useEffect(() => {
    return () => {
      Object.values(intervalsRef.current).forEach(handle => window.clearInterval(handle));
      intervalsRef.current = {};
    };
  }, []);

  const statusText = (status: DownloadItem['status']) => {
    const key: Record<DownloadItem['status'], string> = {
      waiting: t('thunder.statusWaiting'),
      downloading: t('thunder.statusDownloading'),
      paused: t('thunder.statusPaused'),
      completed: t('thunder.statusCompleted'),
      error: t('thunder.statusError'),
    };
    return key[status];
  };

  return (
    <Wrap>
      <Header>
        <LogoBox>
          <LogoIcon />
        </LogoBox>
        <HeaderText>
          <div className="title">{t('thunder.title')}</div>
          <div className="version">{t('thunder.version')}</div>
        </HeaderText>
      </Header>

      <Toolbar>
        <ToolbarBtn $primary onClick={addDownload}>
          <XPIcon name="add" size={16} /> {t('thunder.newTask')}
        </ToolbarBtn>
        <ToolbarBtn onClick={handleStartClick} disabled={items.length === 0}>
          <XPIcon name="media_play" size={16} /> {t('thunder.start')}
        </ToolbarBtn>
        <ToolbarBtn
          onClick={handlePauseClick}
          disabled={!selectedItem || selectedItem.status !== 'downloading'}
        >
          <XPIcon name="media_pause" size={16} /> {t('thunder.pause')}
        </ToolbarBtn>
        <ToolbarBtn onClick={handleDeleteClick} disabled={!selectedItem}>
          <XPIcon name="delete_xp" size={16} /> {t('thunder.delete')}
        </ToolbarBtn>
      </Toolbar>

      <Main>
        <ListHeader>
          <Cell $flex={3}>{t('thunder.columnName')}</Cell>
          <Cell $flex={1.8}>{t('thunder.columnProgress')}</Cell>
          <Cell $flex={1}>{t('thunder.columnSpeed')}</Cell>
          <Cell $flex={0.8} $align="center">
            {t('thunder.columnStatus')}
          </Cell>
          <Cell $flex={0.8} $align="right">
            {t('thunder.columnSize')}
          </Cell>
        </ListHeader>

        <ListBody>
          {items.length === 0 ? (
            <EmptyState>{t('thunder.empty')}</EmptyState>
          ) : (
            items.map(item => (
              <ListRow
                key={item.id}
                $selected={selectedId === item.id}
                onClick={() => setSelectedId(item.id)}
              >
                <Cell $flex={3}>{item.name}</Cell>
                <Cell $flex={1.8}>
                  <ProgressWrap>
                    <ProgressFill $value={item.progress} $status={item.status} />
                    <ProgressText>{item.progress.toFixed(1)}%</ProgressText>
                  </ProgressWrap>
                </Cell>
                <Cell $flex={1}>{item.speed}</Cell>
                <Cell $flex={0.8} $align="center">
                  <StatusBadge $status={item.status}>{statusText(item.status)}</StatusBadge>
                </Cell>
                <Cell $flex={0.8} $align="right">
                  {item.size}
                </Cell>
              </ListRow>
            ))
          )}
        </ListBody>
      </Main>

      <StatusBar>
        <span>{t('thunder.statusCount', { count: items.length })}</span>
        <span>
          {t('thunder.statusSpeed')}: <StatusMetric>{totalSpeed}</StatusMetric>
        </span>
      </StatusBar>
    </Wrap>
  );
};

export default Thunder;
