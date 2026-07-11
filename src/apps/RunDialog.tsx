import React, { useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useApp } from '../hooks/useApp';
import { APP_REGISTRY, getAppDisplayName } from '../registry/apps';
import { defaultPlugin } from './BrowserPlugins';
import { SYSTEM_PATHS } from '../data/systemPaths';
import { triggerBsod } from '../utils/easterEggs';
import { XPTextInput } from '../components/XPTextInput';
import { XPButton } from '../components/XPButton';
import XPIcon from '../components/XPIcon';

const Container = styled.div`
  padding: 11px 9px 9px;
  display: flex;
  flex-direction: column;
  gap: 11px;
  font-family: "Tahoma", "SimSun", "Microsoft YaHei", sans-serif;
  font-size: 11px;
`;

/* Icon + descriptive text, mirroring the real XP Run dialog header. */
const Prompt = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
`;

const PromptText = styled.div`
  font-size: 11px;
  line-height: 1.35;
  color: #000;
  padding-top: 2px;
`;

/* "Open:" label sitting inline with the combobox, left-aligned label column. */
const InputRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const OpenLabel = styled.label`
  flex-shrink: 0;
`;

const Field = styled(XPTextInput)`
  flex: 1;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 7px;
  margin-top: 4px;
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
  sol: 'Solitaire',
  minesweeper: 'Minesweeper',
  winmine: 'Minesweeper',
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
  qq: 'QQ',
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

    // Hidden classic commands (#85).
    if (lower === 'winver') {
      api.dialog.alert({
        title: t('runDialog.winverTitle', 'About Windows'),
        message: t('runDialog.winverMessage', {
          defaultValue:
            'Microsoft Windows XP\nVersion 5.1 (Build 2600.xpsp_sp3)\nCopyright © 1985-2001 Microsoft Corp.',
        }),
        type: 'info',
      });
      api.window.close();
      return;
    }
    if (lower === 'bsod') {
      api.window.close();
      triggerBsod();
      return;
    }
    // The real Run box refuses format with an access-denied error.
    if (lower === 'format' || lower.startsWith('format ')) {
      api.dialog.alert({
        title: t('runDialog.errorTitle'),
        message: t('runDialog.formatDenied', {
          defaultValue: 'Access is denied. Formatting the system drive is not permitted.',
        }),
        type: 'error',
      });
      return;
    }

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
      title: t('runDialog.errorTitle'),
      message: t('runDialog.errorMessage', { command: trimmed }),
      type: 'error',
    });
  };

  const handleCancel = () => {
    api?.window.close();
  };

  // Browse opens the file explorer at My Computer, matching XP's file picker entry point.
  const handleBrowse = () => {
    if (!api) return;
    const def = APP_REGISTRY.Explorer;
    api.openWindow(
      'Explorer',
      getAppDisplayName(def, t),
      def.restore({ initialPath: [...SYSTEM_PATHS.myComputer] }),
      def.icon,
      def.window
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleRun();
    }
  };

  return (
    <Container>
      <Prompt>
        <XPIcon name="run" size={32} />
        <PromptText>{t('runDialog.description')}</PromptText>
      </Prompt>
      <InputRow>
        <OpenLabel htmlFor="run-open">{t('runDialog.open')}</OpenLabel>
        <Field
          id="run-open"
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={handleKeyDown}
          data-testid="run-dialog-input"
          autoFocus
        />
      </InputRow>
      <ButtonContainer>
        <XPButton onClick={handleRun}>{t('common.ok', 'OK')}</XPButton>
        <XPButton onClick={handleCancel}>{t('common.cancel', 'Cancel')}</XPButton>
        <XPButton onClick={handleBrowse}>{t('runDialog.browse')}</XPButton>
      </ButtonContainer>
    </Container>
  );
};

export default RunDialog;
