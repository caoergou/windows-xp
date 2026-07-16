import React from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { FONTS } from '../../constants';

const Container = styled.div`
  width: 100%;
  height: 100%;
  background: white;
  padding: 40px;
  font-family: ${FONTS.UI};
  font-size: 12px;
  color: #000;
  overflow-y: auto;
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
`;

const InfoIcon = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #316ac5;
  color: white;
  font-weight: bold;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: Georgia, serif;
`;

const Title = styled.h1`
  font-size: 16px;
  margin: 0;
  font-weight: bold;
  color: #000;
`;

const Description = styled.p`
  margin: 0 0 20px 0;
  line-height: 1.6;
`;

const Section = styled.div`
  margin-bottom: 16px;
`;

const SectionTitle = styled.div`
  font-weight: bold;
  margin-bottom: 6px;
`;

const BulletList = styled.ul`
  margin: 0;
  padding-left: 20px;
  line-height: 1.8;
`;

const ActionRow = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 20px;
`;

const ActionButton = styled.button`
  padding: 3px 12px;
  font-size: 12px;
  cursor: pointer;
  border: 1px solid #7f9db9;
  background: linear-gradient(to bottom, #ffffff, #ece9d8);
  font-family: ${FONTS.UI};

  &:hover {
    background: linear-gradient(to bottom, #f0f0f0, #dcd9c9);
  }

  &:active {
    background: linear-gradient(to bottom, #ece9d8, #ffffff);
  }
`;

interface IEErrorPageProps {
  url: string;
  onRefresh?: () => void;
  onDiagnose?: () => void;
}

const IEErrorPage: React.FC<IEErrorPageProps> = ({ url, onRefresh, onDiagnose }) => {
  const { t } = useTranslation();

  return (
    <Container>
      <TitleRow>
        <InfoIcon>i</InfoIcon>
        <Title>{t('internetExplorer.errorPage.title')}</Title>
      </TitleRow>

      <Description>{t('internetExplorer.errorPage.description')}</Description>

      <Section>
        <SectionTitle>{t('internetExplorer.errorPage.possibleActions')}</SectionTitle>
        <BulletList>
          <li>{t('internetExplorer.errorPage.clickRefresh')}</li>
          <li>{t('internetExplorer.errorPage.checkAddress')}</li>
          <li>{t('internetExplorer.errorPage.checkConnection')}</li>
        </BulletList>
      </Section>

      <Section>
        <SectionTitle>HTTP {t('internetExplorer.errorPage.notFound')}</SectionTitle>
        <div style={{ color: '#666' }}>{url}</div>
      </Section>

      <ActionRow>
        <ActionButton onClick={onRefresh}>{t('internetExplorer.errorPage.refresh')}</ActionButton>
        <ActionButton onClick={onDiagnose}>{t('internetExplorer.errorPage.diagnose')}</ActionButton>
      </ActionRow>
    </Container>
  );
};

export default IEErrorPage;
