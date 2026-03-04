import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

const WarningContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 999999;
  padding: 20px;
  box-sizing: border-box;
`;

const WarningCard = styled.div`
  background: #f0f0f0;
  border: 2px solid #3366cc;
  border-radius: 8px;
  padding: 30px;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  text-align: center;
`;

const WarningIcon = styled.div`
  font-size: 64px;
  margin-bottom: 20px;
`;

const WarningTitle = styled.h2`
  color: #333;
  font-size: 24px;
  margin: 0 0 15px 0;
  font-family: 'Tahoma', sans-serif;
`;

const WarningText = styled.p`
  color: #555;
  font-size: 16px;
  line-height: 1.6;
  margin: 0 0 25px 0;
  font-family: 'Tahoma', sans-serif;
`;

const ContinueButton = styled.button`
  background: linear-gradient(to bottom, #5a8adf, #3a6ea5);
  color: white;
  border: 1px solid #316ac5;
  border-radius: 4px;
  padding: 10px 25px;
  font-size: 14px;
  font-family: 'Tahoma', sans-serif;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: linear-gradient(to bottom, #6b98e8, #4a7fd0);
    border-color: #3b76c4;
  }

  &:active {
    background: linear-gradient(to bottom, #3a6ea5, #2d57a0);
  }
`;

const isMobileDevice = () => {
  const width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
  const height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

  // 检测移动设备的关键指标
  return (
    // 设备宽度小于 768px
    width < 768 ||
    // 设备高度小于 600px 且宽度较小
    (height < 600 && width < 1024) ||
    // 触摸设备检测
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0
  );
};

const MobileWarning: React.FC = () => {
  const { t } = useTranslation();
  const [isMobile, setIsMobile] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(isMobileDevice());
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleContinue = () => {
    setDismissed(true);
  };

  if (!isMobile || dismissed) {
    return null;
  }

  return (
    <WarningContainer>
      <WarningCard>
        <WarningIcon>⚠️</WarningIcon>
        <WarningTitle>{t('mobileWarning.title')}</WarningTitle>
        <WarningText>{t('mobileWarning.message')}</WarningText>
        <ContinueButton onClick={handleContinue}>{t('mobileWarning.continue')}</ContinueButton>
      </WarningCard>
    </WarningContainer>
  );
};

export default MobileWarning;
