import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

const LanguageSwitcher: React.FC = () => {
  const { i18n, t } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'zh' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <SwitcherButton onClick={toggleLanguage} title={t('settings.language')}>
      {i18n.language === 'en' ? 'EN' : '中'}
    </SwitcherButton>
  );
};

const SwitcherButton = styled.button`
  width: 22px;
  height: 22px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 0;
  color: white;
  font-size: 11px;
  font-weight: bold;
  padding: 0;
  margin: 0 2px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.2);
  }

  &:active {
    background: rgba(0, 0, 0, 0.1);
    box-shadow: inset 1px 1px 2px rgba(0, 0, 0, 0.3);
  }
`;

export default LanguageSwitcher;
