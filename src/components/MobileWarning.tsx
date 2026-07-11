import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import XPIcon from './XPIcon';
import { XPButton } from './XPButton';
import { XPDialogFrame, XPDialogContent, XPDialogButtonRow } from './XPDialogChrome';

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

const WarningBody = styled.div`
  display: flex;
  gap: 14px;
  align-items: flex-start;
  font-family: 'Tahoma', 'SimSun', 'Microsoft YaHei', sans-serif;
`;

const WarningText = styled.p`
  color: #000;
  font-size: 11px;
  line-height: 1.5;
  margin: 0;
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
    ((navigator as Navigator & { msMaxTouchPoints?: number }).msMaxTouchPoints ?? 0) > 0
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
    <WarningContainer className="windows-xp-portal">
      <XPDialogFrame
        title={t('mobileWarning.title')}
        onClose={handleContinue}
        width={340}
        data-testid="mobile-warning"
      >
        <XPDialogContent>
          <WarningBody>
            <XPIcon name="dialog_warning" size={32} />
            <WarningText>{t('mobileWarning.message')}</WarningText>
          </WarningBody>
        </XPDialogContent>
        <XPDialogButtonRow>
          <XPButton onClick={handleContinue}>{t('mobileWarning.continue')}</XPButton>
        </XPDialogButtonRow>
      </XPDialogFrame>
    </WarningContainer>
  );
};

export default MobileWarning;
