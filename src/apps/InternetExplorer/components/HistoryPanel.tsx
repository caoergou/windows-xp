import React from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { BrowsingHistoryItem } from '../types';
import { Sidebar, SidebarHeader, HistoryList, HistoryItem } from '../styled';

interface HistoryPanelProps {
  history: BrowsingHistoryItem[];
  onNavigate: (url: string) => void;
  onClose: () => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, onNavigate, onClose }) => {
  const { t } = useTranslation();

  return (
    <Sidebar>
      <SidebarHeader>
        <span>{t('internetExplorer.history')}</span>
        <X size={14} style={{ cursor: 'pointer' }} onClick={onClose} />
      </SidebarHeader>
      <HistoryList>
        {history.map((item, index) => (
          <HistoryItem key={index} onClick={() => onNavigate(item.url)}>
            <div className="url">{item.url}</div>
            <div className="time">{new Date(item.timestamp).toLocaleString()}</div>
          </HistoryItem>
        ))}
        {history.length === 0 && (
          <div style={{ padding: 10, color: '#888', fontSize: 12 }}>
            {t('internetExplorer.noHistory')}
          </div>
        )}
      </HistoryList>
    </Sidebar>
  );
};

export default HistoryPanel;
