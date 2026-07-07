import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

interface DownloadItem {
  id: string;
  name: string;
  size: string;
  progress: number;
  speed: string;
  status: 'waiting' | 'downloading' | 'paused' | 'completed' | 'error';
}

const Wrap = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f7f7f7;
  font-family: 'Microsoft YaHei', '微软雅黑', Tahoma, sans-serif;
  font-size: 12px;
  color: #333;
  user-select: none;
  overflow: hidden;
`;

const Header = styled.div`
  background: linear-gradient(to bottom, #4a9eff 0%, #0066cc 50%, #0055aa 100%);
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid #004488;
  flex-shrink: 0;
`;

const LogoBox = styled.div`
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #ffcc00 0%, #ff8800 100%);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.4), 0 2px 4px rgba(0, 0, 0, 0.3);
  flex-shrink: 0;
`;

const LogoIcon = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
    <path
      d="M20 3L10 16h5l-3 9 10-12h-5l4-10z"
      fill="#fff"
      stroke="#cc5500"
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
    color: #cce4ff;
  }
`;

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: linear-gradient(to bottom, #ffffff 0%, #eef3f9 100%);
  border-bottom: 1px solid #c7d8eb;
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
    background: linear-gradient(to bottom, #ffcc66 0%, #ffaa33 50%, #ff8800 100%);
    color: #fff;
    border-color: #cc6600;
    text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.3);

    &:hover {
      background: linear-gradient(to bottom, #ffd67a 0%, #ffb84d 50%, #ff9933 100%);
    }
    &:active {
      background: linear-gradient(to bottom, #ff8800 0%, #e66b00 100%);
      box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.3);
    }
  `
      : `
    background: linear-gradient(to bottom, #ffffff 0%, #f0f0f0 50%, #e0e0e0 100%);
    color: #333;
    border-color: #999;

    &:hover {
      background: linear-gradient(to bottom, #ffffff 0%, #f7f7f7 50%, #ebebeb 100%);
    }
    &:active {
      background: linear-gradient(to bottom, #e0e0e0 0%, #d0d0d0 100%);
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
  background: #fff;
  overflow: hidden;
`;

const ListHeader = styled.div`
  display: flex;
  align-items: center;
  padding: 5px 10px;
  background: linear-gradient(to bottom, #f7fbff 0%, #e3eef9 100%);
  border-bottom: 1px solid #c7d8eb;
  color: #335577;
  font-weight: bold;
  flex-shrink: 0;
`;

const ListBody = styled.div`
  flex: 1;
  overflow-y: auto;
  background: #fff;
`;

const ListRow = styled.div<{ $selected?: boolean }>`
  display: flex;
  align-items: center;
  padding: 7px 10px;
  border-bottom: 1px solid #eef2f5;
  cursor: pointer;
  background: ${p => (p.$selected ? '#fff3e0' : 'transparent')};

  &:hover {
    background: ${p => (p.$selected ? '#ffe8cc' : '#f9fbfd')};
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
  background: #e8e8e8;
  border: 1px solid #bbb;
  border-radius: 2px;
  overflow: hidden;
  position: relative;
`;

const ProgressFill = styled.div<{ $value: number; $status: DownloadItem['status'] }>`
  width: ${p => p.$value}%;
  height: 100%;
  background: ${p =>
    p.$status === 'completed'
      ? 'linear-gradient(to bottom, #88cc88 0%, #55aa55 100%)'
      : p.$status === 'error'
      ? 'linear-gradient(to bottom, #ff9999 0%, #cc5555 100%)'
      : 'linear-gradient(to bottom, #66bbff 0%, #0088ff 100%)'};
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
  color: #333;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.6);
`;

const EmptyState = styled.div`
  padding: 30px;
  text-align: center;
  color: #999;
`;

const StatusBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 10px;
  background: linear-gradient(to bottom, #f0f5fa 0%, #dce6f2 100%);
  border-top: 1px solid #c7d8eb;
  font-size: 11px;
  color: #445566;
  flex-shrink: 0;
`;

const StatusMetric = styled.span`
  color: #0066cc;
  font-weight: bold;
`;

const StatusBadge = styled.span<{ $status: DownloadItem['status'] }>`
  display: inline-block;
  padding: 1px 6px;
  border-radius: 2px;
  font-size: 11px;
  color: #fff;
  background: ${p =>
    p.$status === 'completed'
      ? '#55aa55'
      : p.$status === 'downloading'
      ? '#0088ff'
      : p.$status === 'paused'
      ? '#ffaa33'
      : p.$status === 'error'
      ? '#cc5555'
      : '#999'};
`;

const defaultDownloads: DownloadItem[] = [
  { id: '1', name: '暴风影音.exe', size: '28.5 MB', progress: 100, speed: '0 KB/s', status: 'completed' },
  { id: '2', name: 'QQ2007.exe', size: '18.2 MB', progress: 62, speed: '156 KB/s', status: 'downloading' },
  { id: '3', name: '魔兽争霸3.mpq', size: '512 MB', progress: 24, speed: '128 KB/s', status: 'downloading' },
  { id: '4', name: '卡巴斯基2009.exe', size: '42.0 MB', progress: 0, speed: '0 KB/s', status: 'waiting' },
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
          ➕ {t('thunder.newTask')}
        </ToolbarBtn>
        <ToolbarBtn onClick={handleStartClick} disabled={items.length === 0}>
          ▶ {t('thunder.start')}
        </ToolbarBtn>
        <ToolbarBtn onClick={handlePauseClick} disabled={!selectedItem || selectedItem.status !== 'downloading'}>
          ⏸ {t('thunder.pause')}
        </ToolbarBtn>
        <ToolbarBtn onClick={handleDeleteClick} disabled={!selectedItem}>
          🗑 {t('thunder.delete')}
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
        <span>
          {t('thunder.statusCount', { count: items.length })}
        </span>
        <span>
          {t('thunder.statusSpeed')}: <StatusMetric>{totalSpeed}</StatusMetric>
        </span>
      </StatusBar>
    </Wrap>
  );
};

export default Thunder;
