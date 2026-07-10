import React, { useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-family: "Tahoma", "SimSun", "Microsoft YaHei", sans-serif;
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
  -webkit-appearance: none;
  width: 100%;
  height: 6px;
  background: linear-gradient(to bottom, #ffffff, #ece9d8);
  border: 1px solid #7f9db9;
  outline: none;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    background: linear-gradient(to bottom, #ffffff, #ece9d8);
    border: 1px solid #7f9db9;
    cursor: pointer;

    &:hover {
      background: linear-gradient(to bottom, #f0f0f0, #dcd9c9);
    }
  }

  &::-moz-range-thumb {
    width: 16px;
    height: 16px;
    background: linear-gradient(to bottom, #ffffff, #ece9d8);
    border: 1px solid #7f9db9;
    cursor: pointer;
  }
`;

const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Checkbox = styled.input`
  width: 13px;
  height: 13px;
  cursor: pointer;
`;

const CheckboxLabel = styled.label`
  cursor: pointer;
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid #d4d0c8;
`;

const Button = styled.button`
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
            onChange={(e) => setPointerSpeed(parseInt(e.target.value))}
          />
        </Row>
      </GroupBox>
      <GroupBox>
        <GroupTitle>{t('controlPanel.mouseSettings.doubleClickSpeed', 'Double-click speed:')}</GroupTitle>
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
            onChange={(e) => setDoubleClickSpeed(parseInt(e.target.value))}
          />
        </Row>
      </GroupBox>
      <GroupBox>
        <GroupTitle>{t('controlPanel.mouseSettings.pointerTrails', 'Show pointer trails')}</GroupTitle>
        <CheckboxContainer>
          <Checkbox
            type="checkbox"
            id="cp-pointer-trails"
            checked={pointerTrails}
            onChange={(e) => setPointerTrails(e.target.checked)}
          />
          <CheckboxLabel htmlFor="cp-pointer-trails">
            {t('controlPanel.mouseSettings.pointerTrails', 'Show pointer trails')}
          </CheckboxLabel>
        </CheckboxContainer>
      </GroupBox>
      <ButtonRow>
        <Button onClick={onBack}>{t('controlPanel.ok', 'OK')}</Button>
        <Button onClick={onBack}>{t('controlPanel.cancel', 'Cancel')}</Button>
      </ButtonRow>
    </Container>
  );
};

export default MouseSettings;
