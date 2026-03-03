import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  padding: 16px;
  font-family: Tahoma, Arial, sans-serif;
  font-size: 12px;
  height: 100%;
`;

const Title = styled.h3`
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: bold;
`;

const CategoryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 16px;
`;

const CategoryItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: linear-gradient(to bottom, #ffffff, #ece9d8);
  border: 1px solid #7f9db9;
  border-radius: 4px;
  cursor: pointer;
  text-align: center;

  &:hover {
    background: linear-gradient(to bottom, #f0f0f0, #dcd9c9);
    border-color: #000080;
  }
`;

const CategoryIcon = styled.div`
  font-size: 32px;
`;

const CategoryName = styled.div`
  font-weight: bold;
`;

const ControlPanel = () => {
  const categories = [
    { name: '添加或删除程序', icon: '💻' },
    { name: '外观和主题', icon: '🎨' },
    { name: '日期和时间', icon: '⏰' },
    { name: '显示', icon: '🖥️' },
    { name: '文件夹选项', icon: '📁' },
    { name: '字体', icon: '📝' },
    { name: '键盘', icon: '⌨️' },
    { name: '鼠标', icon: '🖱️' },
    { name: '网络连接', icon: '🖧' },
    { name: '用户账户', icon: '👤' },
    { name: '声音和音频设备', icon: '🔊' },
    { name: '系统', icon: '⚙️' },
  ];

  const handleCategoryClick = (name) => {
    console.log('Opening category:', name);
  };

  return (
    <Container>
      <Title>控制面板</Title>
      <CategoryGrid>
        {categories.map((category, index) => (
          <CategoryItem key={index} onClick={() => handleCategoryClick(category.name)}>
            <CategoryIcon>{category.icon}</CategoryIcon>
            <CategoryName>{category.name}</CategoryName>
          </CategoryItem>
        ))}
      </CategoryGrid>
    </Container>
  );
};

export default ControlPanel;
