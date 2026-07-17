import React, { useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { XPCheckbox } from '../../components/XPCheckbox';
import { xpTrackbarStyles } from '../../theme';
import { resolveOSTheme } from '../../themes/useOSTheme';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-family: ${({ theme }) => resolveOSTheme(theme).fonts.UI};
  font-size: 11px;
  color: ${({ theme }) => resolveOSTheme(theme).tokens.BLACK};
`;

const GroupBox = styled.div`
  border: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.FIELD_BORDER};
  padding: 12px;
  background: ${({ theme }) => resolveOSTheme(theme).tokens.WHITE};
`;

const GroupTitle = styled.div`
  font-weight: bold;
  margin-bottom: 8px;
  color: ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_BORDER};
`;

const Row = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const LabelRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Label = styled.div`
  color: ${({ theme }) => resolveOSTheme(theme).tokens.BLACK};
`;

const Value = styled.div`
  color: ${({ theme }) => resolveOSTheme(theme).tokens.GREY_66};
`;

const Slider = styled.input`
  width: 100%;
  ${xpTrackbarStyles}
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.SURFACE};
`;

const Button = styled.button`
  padding: 3px 14px;
  font-size: 11px;
  border: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_BORDER};
  background: ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_GRADIENT};
  cursor: pointer;
  font-family: ${({ theme }) => resolveOSTheme(theme).fonts.UI};

  &:hover {
    box-shadow: ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_HOVER_SHADOW};
  }
`;

interface MouseSettingsProps {
  onBack: () => void;
}

const MouseSettings: React.FC<MouseSettingsProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const [pointerSpeed, setPointerSpeed] = useState(50);
  const [doubleClickSpeed, setDoubleClickSpeed] = useState(50);
  const [pointerTrails, setPointerTrails] = useState(false);

  return (
    <Container>
      <GroupBox>
        <GroupTitle>{t('controlPanel.mouseSettings.pointerSpeed', 'Pointer speed:')}</GroupTitle>
        <Row>
          <LabelRow>
            <Label>{t('controlPanel.mouseSettings.pointerSpeed', 'Pointer speed:')}</Label>
            <Value>{pointerSpeed}%</Value>
          </LabelRow>
          <Slider
            type="range"
            min="0"
            max="100"
            value={pointerSpeed}
            onChange={e => setPointerSpeed(parseInt(e.target.value))}
          />
        </Row>
      </GroupBox>
      <GroupBox>
        <GroupTitle>
          {t('controlPanel.mouseSettings.doubleClickSpeed', 'Double-click speed:')}
        </GroupTitle>
        <Row>
          <LabelRow>
            <Label>{t('controlPanel.mouseSettings.doubleClickSpeed', 'Double-click speed:')}</Label>
            <Value>{doubleClickSpeed}%</Value>
          </LabelRow>
          <Slider
            type="range"
            min="0"
            max="100"
            value={doubleClickSpeed}
            onChange={e => setDoubleClickSpeed(parseInt(e.target.value))}
          />
        </Row>
      </GroupBox>
      <GroupBox>
        <GroupTitle>
          {t('controlPanel.mouseSettings.pointerTrails', 'Show pointer trails')}
        </GroupTitle>
        <XPCheckbox
          id="cp-pointer-trails"
          checked={pointerTrails}
          onChange={e => setPointerTrails(e.target.checked)}
          label={t('controlPanel.mouseSettings.pointerTrails', 'Show pointer trails')}
        />
      </GroupBox>
      <ButtonRow>
        <Button onClick={onBack}>{t('controlPanel.ok', 'OK')}</Button>
        <Button onClick={onBack}>{t('controlPanel.cancel', 'Cancel')}</Button>
      </ButtonRow>
    </Container>
  );
};

export default MouseSettings;
