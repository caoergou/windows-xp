import React, { useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
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

const Container = styled.div`
  padding: 16px;
  font-family: "Tahoma", "SimSun", "Microsoft YaHei", sans-serif;
  font-size: 12px;
  height: 100%;
  background: #ece9d8;
  display: flex;
  flex-direction: column;
`;

const Title = styled.h3`
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: bold;
  color: #000000;
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
  background: #ece9d8;
  border: 1px solid transparent;
  cursor: pointer;

  &:hover {
    background-color: #e8f4ff;
    border: 1px solid #c0deff;
  }

  ${props => props.$selected && `
    background-color: #316ac5;
    color: white;
    border: 1px dotted #fff;

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
  color: ${props => props.$selected ? '#ffffff' : '#000000'};
`;

const BackButton = styled.button`
  align-self: flex-start;
  margin-bottom: 12px;
  padding: 3px 14px;
  font-size: 11px;
  border: 1px solid #003c74;
  background: linear-gradient(180deg, #ffffff 0%, #ecebe5 86%, #d8d0c4 100%);
  cursor: pointer;
  font-family: "Tahoma", "SimSun", "Microsoft YaHei", sans-serif;

  &:hover {
    box-shadow: inset -1px 1px #fff0cf, inset 1px 2px #fdd889, inset -2px 2px #fbc761, inset 2px -2px #e5a01a;
  }
`;

interface Category {
  name: string;
  icon: string;
  id: string;
}

type SubPage = 'display' | 'sound' | 'mouse' | null;

const ControlPanel = () => {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [subPage, setSubPage] = useState<SubPage>(null);

  const categories: Category[] = [
    { name: '添加或删除程序', icon: addRemoveProgramsIcon, id: 'addRemovePrograms' },
    { name: '外观和主题', icon: appearanceIcon, id: 'appearance' },
    { name: '日期和时间', icon: dateTimeIcon, id: 'dateTime' },
    { name: '显示', icon: displayIcon, id: 'display' },
    { name: '文件夹选项', icon: folderOptionsIcon, id: 'folderOptions' },
    { name: '字体', icon: fontsIcon, id: 'fonts' },
    { name: '键盘', icon: keyboardIcon, id: 'keyboard' },
    { name: '鼠标', icon: mouseIcon, id: 'mouse' },
    { name: '网络连接', icon: networkIcon, id: 'network' },
    { name: '用户账户', icon: userAccountsIcon, id: 'userAccounts' },
    { name: '声音和音频设备', icon: soundIcon, id: 'sound' },
    { name: '系统', icon: systemIcon, id: 'system' },
  ];

  const handleCategoryClick = (category: Category) => {
    setSelectedCategory(category.name);
    if (category.id === 'display') {
      setSubPage('display');
    } else if (category.id === 'sound') {
      setSubPage('sound');
    } else if (category.id === 'mouse') {
      setSubPage('mouse');
    }
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
            $selected={selectedCategory === category.name}
            onClick={() => handleCategoryClick(category)}
          >
            <CategoryIcon src={category.icon} alt={category.name} />
            <CategoryName $selected={selectedCategory === category.name}>{category.name}</CategoryName>
          </CategoryItem>
        ))}
      </CategoryGrid>
    </Container>
  );
};

export default ControlPanel;
