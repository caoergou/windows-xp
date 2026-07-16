import React, { useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { XPSelect } from '../components/XPSelect';
import addRemoveProgramsIcon from '../assets/icons/control-panel/add_remove_programs.png';
import appearanceIcon from '../assets/icons/control-panel/appearance.png';
import dateTimeIcon from '../assets/icons/control-panel/date_time.png';
import displayIcon from '../assets/icons/control-panel/display.png';
import folderOptionsIcon from '../assets/icons/control-panel/folder_options.png';
import fontsIcon from '../assets/icons/control-panel/fonts.png';
import keyboardIcon from '../assets/icons/control-panel/keyboard.png';
import mouseIcon from '../assets/icons/control-panel/mouse.png';
import networkIcon from '../assets/icons/control-panel/network.png';
import userAccountsIcon from '../assets/icons/control-panel/user_accounts.png';
import soundIcon from '../assets/icons/control-panel/sound.png';
import systemIcon from '../assets/icons/control-panel/system.png';
import DisplaySettings from './ControlPanel/DisplaySettings';
import SoundSettings from './ControlPanel/SoundSettings';
import MouseSettings from './ControlPanel/MouseSettings';
import { useApp } from '../hooks/useApp';
import { canUseDOM } from '../utils/storage';
import { useStorage } from '../context/StorageContext';
import { getSavedLanguage, saveLanguage, SupportedLanguage } from '../utils/language';
import { sounds } from '../utils/soundManager';
import { COLORS, FONTS } from '../constants';

const Container = styled.div`
  padding: 16px;
  font-family: ${FONTS.UI};
  font-size: 12px;
  height: 100%;
  background: ${COLORS.SURFACE};
  display: flex;
  flex-direction: column;
`;

const Title = styled.h3`
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: bold;
  color: ${COLORS.BLACK};
`;

const CategoryGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const CategoryItem = styled.div<{ $selected?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 220px;
  padding: 4px;
  background: ${COLORS.SURFACE};
  border: 1px solid transparent;
  cursor: pointer;

  &:hover {
    background-color: #e8f4ff;
    border: 1px solid #c0deff;
  }

  ${props =>
    props.$selected &&
    `
    background-color: #316ac5;
    color: white;
    border: 1px dotted ${COLORS.WHITE};

    &:hover {
      background-color: #316ac5;
      color: white;
    }
  `}
`;

const CategoryIcon = styled.img`
  width: 48px;
  height: 48px;
  object-fit: contain;
  image-rendering: auto;
  flex-shrink: 0;
`;

const CategoryName = styled.div<{ $selected?: boolean }>`
  font-size: 11px;
  color: ${props => (props.$selected ? COLORS.WHITE : COLORS.BLACK)};
`;

const BackButton = styled.button`
  align-self: flex-start;
  margin-bottom: 12px;
  padding: 3px 14px;
  font-size: 11px;
  border: 1px solid ${COLORS.BUTTON_BORDER};
  background: linear-gradient(180deg, ${COLORS.WHITE} 0%, #ecebe5 86%, #d8d0c4 100%);
  cursor: pointer;
  font-family: ${FONTS.UI};

  &:hover {
    box-shadow: ${COLORS.BUTTON_HOVER_SHADOW};
  }
`;

const SystemSettings = styled.div`
  width: 100%;
  max-width: 460px;
  border: 1px solid ${COLORS.BORDER_GREY};
  background: ${COLORS.WHITE};
  padding: 14px;

  h4 {
    margin: 0 0 12px;
    color: #003399;
    font-size: 13px;
  }

  label {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  select {
    min-width: 180px;
    height: 23px;
    font:
      11px Tahoma,
      'Microsoft YaHei',
      sans-serif;
  }
`;

interface Category {
  icon: string;
  id: string;
}

type SubPage = 'display' | 'sound' | 'mouse' | 'system' | null;

const ControlPanel = ({ windowId }: { windowId?: string }) => {
  const { t, i18n } = useTranslation();
  const api = useApp(windowId || '');
  const storage = useStorage();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [subPage, setSubPage] = useState<SubPage>(null);

  const categories: Category[] = [
    { icon: addRemoveProgramsIcon, id: 'addRemovePrograms' },
    { icon: appearanceIcon, id: 'appearance' },
    { icon: dateTimeIcon, id: 'dateTime' },
    { icon: displayIcon, id: 'display' },
    { icon: folderOptionsIcon, id: 'folderOptions' },
    { icon: fontsIcon, id: 'fonts' },
    { icon: keyboardIcon, id: 'keyboard' },
    { icon: mouseIcon, id: 'mouse' },
    { icon: networkIcon, id: 'network' },
    { icon: userAccountsIcon, id: 'userAccounts' },
    { icon: soundIcon, id: 'sound' },
    { icon: systemIcon, id: 'system' },
  ];

  const handleCategoryClick = (category: Category) => {
    setSelectedCategory(category.id);
    if (category.id === 'display') {
      setSubPage('display');
    } else if (category.id === 'sound') {
      setSubPage('sound');
    } else if (category.id === 'mouse') {
      setSubPage('mouse');
    } else if (category.id === 'system') {
      setSubPage('system');
    }
  };

  const handleLanguageChange = async (language: SupportedLanguage) => {
    if (language === getSavedLanguage(i18n.language === 'zh' ? 'zh' : 'en')) return;
    const confirmed = await api.dialog.confirm({
      title: t('controlPanel.systemLanguage.restartTitle'),
      message: t('controlPanel.systemLanguage.restartMessage'),
      type: 'question',
    });
    if (!confirmed) return;

    saveLanguage(language);
    storage.local.removeItem(storage.key('open_windows'));
    storage.local.setItem(storage.key('power_state'), 'restart');
    sounds.shutdown();
    if (canUseDOM) setTimeout(() => window.location.reload(), 600);
  };

  const handleBack = () => {
    setSubPage(null);
    setSelectedCategory(null);
  };

  const renderSubPage = () => {
    switch (subPage) {
      case 'display':
        return <DisplaySettings onBack={handleBack} />;
      case 'sound':
        return <SoundSettings onBack={handleBack} />;
      case 'mouse':
        return <MouseSettings onBack={handleBack} />;
      case 'system':
        return (
          <SystemSettings>
            <h4>{t('controlPanel.systemLanguage.title')}</h4>
            <label>
              <span>{t('controlPanel.systemLanguage.label')}</span>
              <XPSelect
                aria-label={t('controlPanel.systemLanguage.label')}
                value={getSavedLanguage(i18n.language === 'zh' ? 'zh' : 'en')}
                onChange={event => handleLanguageChange(event.target.value as SupportedLanguage)}
              >
                <option value="en">English</option>
                <option value="zh">简体中文</option>
              </XPSelect>
            </label>
          </SystemSettings>
        );
      default:
        return null;
    }
  };

  if (subPage) {
    return (
      <Container>
        <BackButton onClick={handleBack}>{t('controlPanel.back', 'Back')}</BackButton>
        {renderSubPage()}
      </Container>
    );
  }

  return (
    <Container>
      <Title>{t('controlPanel.title', 'Control Panel')}</Title>
      <CategoryGrid>
        {categories.map((category, index) => (
          <CategoryItem
            key={index}
            $selected={selectedCategory === category.id}
            onClick={() => handleCategoryClick(category)}
          >
            <CategoryIcon src={category.icon} alt={t(`controlPanel.categories.${category.id}`)} />
            <CategoryName $selected={selectedCategory === category.id}>
              {t(`controlPanel.categories.${category.id}`)}
            </CategoryName>
          </CategoryItem>
        ))}
      </CategoryGrid>
    </Container>
  );
};

export default ControlPanel;
