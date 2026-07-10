import React, { useState } from 'react';
import styled from 'styled-components';
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

const Container = styled.div`
  padding: 16px;
  font-family: "Tahoma", "SimSun", "Microsoft YaHei", sans-serif;
  font-size: 12px;
  height: 100%;
  background: #ece9d8;
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

interface Category {
  name: string;
  icon: string;
}

const ControlPanel = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories: Category[] = [
    { name: '添加或删除程序', icon: addRemoveProgramsIcon },
    { name: '外观和主题', icon: appearanceIcon },
    { name: '日期和时间', icon: dateTimeIcon },
    { name: '显示', icon: displayIcon },
    { name: '文件夹选项', icon: folderOptionsIcon },
    { name: '字体', icon: fontsIcon },
    { name: '键盘', icon: keyboardIcon },
    { name: '鼠标', icon: mouseIcon },
    { name: '网络连接', icon: networkIcon },
    { name: '用户账户', icon: userAccountsIcon },
    { name: '声音和音频设备', icon: soundIcon },
    { name: '系统', icon: systemIcon },
  ];

  const handleCategoryClick = (name: string) => {
    setSelectedCategory(name);
  };

  return (
    <Container>
      <Title>控制面板</Title>
      <CategoryGrid>
        {categories.map((category, index) => (
          <CategoryItem
            key={index}
            $selected={selectedCategory === category.name}
            onClick={() => handleCategoryClick(category.name)}
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
