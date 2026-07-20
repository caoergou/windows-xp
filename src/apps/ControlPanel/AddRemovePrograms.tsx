import React, { useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import XPIcon from '../../components/XPIcon';
import { XPButton } from '../../components/XPButton';
import { resolveOSTheme } from '../../themes/useOSTheme';
import { useInstalledApps, InstalledProduct } from '../../context/InstalledAppsContext';
import { useFileSystem } from '../../context/FileSystemContext';
import { useModal } from '../../context/ModalContext';

const Container = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => resolveOSTheme(theme).tokens.GREY_F0};
  font-family: ${({ theme }) => resolveOSTheme(theme).fonts.UI};
`;

const Header = styled.div`
  flex-shrink: 0;
  background: ${({ theme }) => resolveOSTheme(theme).tokens.HEADER_GRADIENT_BLUE};
  color: ${({ theme }) => resolveOSTheme(theme).tokens.WHITE};
  padding: 8px 12px;
  font-weight: bold;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Content = styled.div`
  flex: 1;
  display: flex;
  overflow: hidden;
`;

const Sidebar = styled.div`
  width: 110px;
  flex-shrink: 0;
  background: ${({ theme }) => resolveOSTheme(theme).tokens.WHITE};
  border-right: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.GREY_99};
  display: flex;
  flex-direction: column;
  padding: 6px 4px;
  gap: 4px;
`;

const SidebarButton = styled.button<{ $selected?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 4px;
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  font-family: ${({ theme }) => resolveOSTheme(theme).fonts.UI};

  ${props =>
    props.$selected &&
    `
    background-color: ${resolveOSTheme(props.theme).tokens.MENU_HIGHLIGHT};
    border: 1px dotted ${resolveOSTheme(props.theme).tokens.WHITE};
  `}

  &:hover {
    background-color: ${({ theme, $selected }) =>
      $selected
        ? resolveOSTheme(theme).tokens.MENU_HIGHLIGHT
        : resolveOSTheme(theme).tokens.PANEL_TINT_BLUE};
  }
`;

const SidebarLabel = styled.span<{ $selected?: boolean }>`
  font-size: 11px;
  text-align: center;
  line-height: 1.2;
  color: ${({ theme, $selected }) =>
    $selected ? resolveOSTheme(theme).tokens.WHITE : resolveOSTheme(theme).tokens.BLACK};
`;

const Main = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: ${({ theme }) => resolveOSTheme(theme).tokens.WHITE};
  padding: 12px;
`;

const MainHeader = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 8px;
`;

const MainTitle = styled.span`
  font-weight: bold;
  font-size: 12px;
  color: ${({ theme }) => resolveOSTheme(theme).tokens.BLACK};
`;

const MainSubtitle = styled.span`
  font-size: 11px;
  color: ${({ theme }) => resolveOSTheme(theme).tokens.GREY_66};
`;

const ProgramList = styled.div`
  flex: 1;
  overflow-y: auto;
  border: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.FIELD_BORDER};
  background: ${({ theme }) => resolveOSTheme(theme).tokens.WHITE};
`;

const ProgramRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-bottom: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.GREY_EE};

  &:nth-child(even) {
    background: ${({ theme }) => resolveOSTheme(theme).tokens.GREY_F0};
  }

  &:hover {
    background: ${({ theme }) => resolveOSTheme(theme).tokens.PANEL_TINT_BLUE};
  }

  &:last-child {
    border-bottom: none;
  }
`;

const ProgramInfo = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const ProgramName = styled.div`
  font-weight: bold;
  font-size: 11px;
  color: ${({ theme }) => resolveOSTheme(theme).tokens.BLACK};
`;

const ProgramMeta = styled.div`
  font-size: 10px;
  color: ${({ theme }) => resolveOSTheme(theme).tokens.GREY_66};
  display: flex;
  gap: 12px;
`;

const EmptyState = styled.div`
  padding: 24px 12px;
  text-align: center;
  font-size: 11px;
  color: ${({ theme }) => resolveOSTheme(theme).tokens.GREY_66};
`;

const Placeholder = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 12px;
  text-align: center;
  font-size: 11px;
  color: ${({ theme }) => resolveOSTheme(theme).tokens.GREY_66};
`;

const Footer = styled.div`
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
  padding: 8px 12px;
  border-top: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.GREY_99};
  background: ${({ theme }) => resolveOSTheme(theme).tokens.GREY_F0};
`;

interface AddRemoveProgramsProps {
  onBack: () => void;
}

type Category = 'installed' | 'add' | 'components';

const CATEGORIES: { id: Category; icon: string }[] = [
  { id: 'installed', icon: 'app_window' },
  { id: 'add', icon: 'folder_open' },
  { id: 'components', icon: 'windows_logo' },
];

const AddRemovePrograms: React.FC<AddRemoveProgramsProps> = ({ onBack }) => {
  const { t, i18n } = useTranslation();
  const { products, uninstall } = useInstalledApps();
  const { deleteFile, deleteFolder } = useFileSystem();
  const modal = useModal();
  const [category, setCategory] = useState<Category>('installed');

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat(i18n.language, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(d);
  };

  const handleUninstall = async (product: InstalledProduct) => {
    const displayName = t(product.nameKey);
    const confirmed = await modal.dialog.confirm({
      title: t('addRemovePrograms.title', 'Add or Remove Programs'),
      message: t('addRemovePrograms.confirmUninstall', {
        product: displayName,
        defaultValue: 'Are you sure you want to uninstall {{product}}?',
      }),
      type: 'question',
    });
    if (!confirmed) return;

    const folderName = product.installPath[product.installPath.length - 1];
    const parentPath = product.installPath.slice(0, -1);

    product.installedFiles.forEach(fileName => deleteFile(product.installPath, fileName));
    if (folderName) deleteFolder(parentPath, folderName);

    uninstall(product.id);
  };

  const categoryLabel = (id: Category) =>
    t(`addRemovePrograms.categories.${id}`, {
      defaultValue:
        id === 'installed'
          ? 'Change or Remove Programs'
          : id === 'add'
            ? 'Add New Programs'
            : 'Add/Remove Windows Components',
    });

  return (
    <Container>
      <Header>
        <XPIcon name="app_window" size={20} />
        {t('addRemovePrograms.title', 'Add or Remove Programs')}
      </Header>
      <Content>
        <Sidebar>
          {CATEGORIES.map(entry => (
            <SidebarButton
              key={entry.id}
              $selected={category === entry.id}
              onClick={() => setCategory(entry.id)}
            >
              <XPIcon name={entry.icon} size={32} />
              <SidebarLabel $selected={category === entry.id}>
                {categoryLabel(entry.id)}
              </SidebarLabel>
            </SidebarButton>
          ))}
        </Sidebar>
        {category === 'installed' ? (
          <Main>
            <MainHeader>
              <MainTitle>
                {t('addRemovePrograms.currentlyInstalled', 'Currently installed programs')}
              </MainTitle>
              <MainSubtitle>
                {t('addRemovePrograms.programCount', {
                  count: products.length,
                  defaultValue: '{{count}} programs installed',
                })}
              </MainSubtitle>
            </MainHeader>
            <ProgramList>
              {products.length === 0 ? (
                <EmptyState>
                  {t('addRemovePrograms.noPrograms', 'No programs are currently installed.')}
                </EmptyState>
              ) : (
                products.map(product => (
                  <ProgramRow key={product.id}>
                    <XPIcon name={product.icon || 'app_window'} size={32} />
                    <ProgramInfo>
                      <ProgramName>{t(product.nameKey)}</ProgramName>
                      <ProgramMeta>
                        {product.publisher && (
                          <span>
                            {t('addRemovePrograms.publisher', 'Publisher:')} {product.publisher}
                          </span>
                        )}
                        {product.version && (
                          <span>
                            {t('addRemovePrograms.version', 'Version:')} {product.version}
                          </span>
                        )}
                        <span>
                          {t('addRemovePrograms.installedOn', 'Installed on:')}{' '}
                          {formatDate(product.installedAt)}
                        </span>
                      </ProgramMeta>
                    </ProgramInfo>
                    <XPButton onClick={() => handleUninstall(product)}>
                      {t('addRemovePrograms.changeRemove', 'Change/Remove')}
                    </XPButton>
                  </ProgramRow>
                ))
              )}
            </ProgramList>
          </Main>
        ) : (
          <Placeholder>{categoryLabel(category)}</Placeholder>
        )}
      </Content>
      <Footer>
        <XPButton onClick={onBack}>{t('controlPanel.ok', 'OK')}</XPButton>
      </Footer>
    </Container>
  );
};

export default AddRemovePrograms;
