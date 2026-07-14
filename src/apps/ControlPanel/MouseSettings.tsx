import React, { useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { XPCheckbox } from '../../components/XPCheckbox';
import { xpTrackbarStyles } from '../../theme';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-family: 'Tahoma', 'SimSun', 'Microsoft YaHei', sans-serif;
  font-size: 11px;
  color: #000;
`;

const GroupBox = styled.div`
  border: 1px solid #7f9db9;
  padding: 12px;
  background: #ffffff;
`;

const GroupTitle = styled.div`
  font-weight: bold;
  margin-bottom: 8px;
  color: #003c74;
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
  color: #000;
`;

const Value = styled.div`
  color: #666666;
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
  border-top: 1px solid #ece9d8;
`;

const Button = styled.button`
  padding: 3px 14px;
  font-size: 11px;
  border: 1px solid #003c74;
  background: linear-gradient(180deg, #ffffff 0%, #ecebe5 86%, #d8d0c4 100%);
  cursor: pointer;
  font-family: 'Tahoma', 'SimSun', 'Microsoft YaHei', sans-serif;

  &:hover {
    box-shadow:
      inset -1px 1px #fff0cf,
      inset 1px 2px #fdd889,
      inset -2px 2px #fbc761,
      inset 2px -2px #e5a01a;
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
