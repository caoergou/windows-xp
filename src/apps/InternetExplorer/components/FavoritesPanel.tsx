import React from 'react';
import { useTranslation } from 'react-i18next';
import XPIcon from '../../../components/XPIcon';
import { FavoriteItem } from '../types';
import { Sidebar, SidebarHeader, HistoryList, FavoritesItem, FavoritesToolbar, ToolbarButton } from '../styled';

interface FavoritesPanelProps {
  favorites: FavoriteItem[];
  onNavigate: (url: string) => void;
  onAdd: () => void;
  onClear: () => void;
  onDelete: (index: number) => void;
  onClose: () => void;
}

const FavoritesPanel: React.FC<FavoritesPanelProps> = ({
  favorites,
  onNavigate,
  onAdd,
  onClear,
  onDelete,
  onClose,
}) => {
  const { t } = useTranslation();

  return (
    <Sidebar>
      <SidebarHeader>
        <span>{t('explorer.favorites')}</span>
        <XPIcon name="close" size={14} color="white" style={{ cursor: 'pointer' }} onClick={onClose} />
      </SidebarHeader>
      <FavoritesToolbar>
        <ToolbarButton onClick={onAdd}>{t('contextMenu.new')}</ToolbarButton>
        <ToolbarButton onClick={onClear}>{t('contextMenu.refresh')}</ToolbarButton>
      </FavoritesToolbar>
      <HistoryList>
        {favorites.map((item, index) => (
          <FavoritesItem key={index}>
            <span className="name" onClick={() => onNavigate(item.url)}>
              {item.name}
            </span>
            <span
              className="delete"
              onClick={e => {
                e.stopPropagation();
                onDelete(index);
              }}
            >
              ×
            </span>
          </FavoritesItem>
        ))}
        {favorites.length === 0 && (
          <div style={{ padding: 10, color: '#888', fontSize: 12 }}>
            {t('internetExplorer.noHistory')}
          </div>
        )}
      </HistoryList>
    </Sidebar>
  );
};

export default FavoritesPanel;
