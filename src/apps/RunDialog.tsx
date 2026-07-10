import React, { useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useApp } from '../hooks/useApp';
import { APP_REGISTRY, getAppDisplayName } from '../registry/apps';
import { defaultPlugin } from './BrowserPlugins';

const Container = styled.div`
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-family: "Tahoma", "SimSun", "Microsoft YaHei", sans-serif;
  font-size: 12px;
`;

const Label = styled.label`
  font-weight: bold;
  margin-bottom: 4px;
`;

const InputContainer = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const Input = styled.input`
  flex: 1;
  padding: 4px;
  border: 1px solid #7f9db9;
  font-size: 12px;

  &:focus {
    outline: none;
    border-color: #000080;
    box-shadow: 0 0 0 1px #000080;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
`;

const Button = styled.button`
  padding: 4px 12px;
  font-size: 12px;
  background: linear-gradient(to bottom, #ffffff, #ece9d8);
  border: 1px solid #7f9db9;
  cursor: pointer;

  &:hover {
    background: linear-gradient(to bottom, #f0f0f0, #dcd9c9);
  }

  &:active {
    background: linear-gradient(to bottom, #ece9d8, #ffffff);
  }
`;

interface RunDialogProps {
  windowId?: string;
}

const COMMAND_MAP: Record<string, string> = {
  notepad: 'Notepad',
  calc: 'Calculator',
  calculator: 'Calculator',
  cmd: 'CommandPrompt',
  mspaint: 'MicrosoftPaint',
  paint: 'MicrosoftPaint',
  solitaire: 'Solitaire',
  minesweeper: 'Minesweeper',
  wmplayer: 'WindowsMediaPlayer',
  wmp: 'WindowsMediaPlayer',
  windowsmediaplayer: 'WindowsMediaPlayer',
  iexplore: 'InternetExplorer',
  ie: 'InternetExplorer',
  internetexplorer: 'InternetExplorer',
  explorer: 'Explorer',
  control: 'ControlPanel',
  controlpanel: 'ControlPanel',
  vol: 'VolumeControl',
  volume: 'VolumeControl',
  network: 'NetworkConnections',
  networkconnections: 'NetworkConnections',
  qq: 'QQLogin',
  help: 'HelpAndSupport',
  helpandsupport: 'HelpAndSupport',
};

const RunDialog = ({ windowId = '' }: RunDialogProps) => {
  const { t } = useTranslation();
  const api = useApp(windowId);
  const [command, setCommand] = useState<string>('');

  const handleRun = () => {
    if (!api) return;
    const trimmed = command.trim();
    if (!trimmed) {
      api.window.close();
      return;
    }

    const lower = trimmed.toLowerCase();

    // URL: open in Internet Explorer
    if (lower.startsWith('http://') || lower.startsWith('https://')) {
      api.openWindow(
        'InternetExplorer',
        'Internet Explorer',
        APP_REGISTRY.InternetExplorer.restore({ url: trimmed, plugin: defaultPlugin }),
        'ie',
        { isMaximized: true }
      );
      api.window.close();
      return;
    }

    // Registered command
    const appId = COMMAND_MAP[lower];
    if (appId && APP_REGISTRY[appId]) {
      const def = APP_REGISTRY[appId];
      api.openWindow(appId, getAppDisplayName(def, t), def.restore({}), def.icon, def.window);
      api.window.close();
      return;
    }

    // Unknown command — show error instead of pretending to open a path
    api.dialog.alert({
      title: t('runDialog.errorTitle', 'Windows XP'),
      message: t('runDialog.errorMessage', { command: trimmed, defaultValue: `Windows cannot find '{{command}}'. Make sure you typed the name correctly, and then try again.` }),
      type: 'error',
    });
  };

  const handleCancel = () => {
    api?.window.close();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleRun();
    }
  };

  return (
    <Container>
      <Label>{t('startMenu.run')}:</Label>
      <InputContainer>
        <Input
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('runDialog.placeholder', 'Enter the name of a program, folder, document, or Internet resource...')}
          autoFocus
        />
      </InputContainer>
      <ButtonContainer>
        <Button onClick={handleRun}>{t('common.ok', 'OK')}</Button>
        <Button onClick={handleCancel}>{t('common.cancel', 'Cancel')}</Button>
      </ButtonContainer>
    </Container>
  );
};

export default RunDialog;
