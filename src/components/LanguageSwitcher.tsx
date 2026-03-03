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
  background: transparent;
  border: none;
  color: white;
  font-size: 11px;
  font-weight: bold;
  padding: 2px 6px;
  cursor: pointer;
  height: 100%;
  display: flex;
  align-items: center;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  &:active {
    background: rgba(255, 255, 255, 0.2);
  }
`;

export default LanguageSwitcher;
