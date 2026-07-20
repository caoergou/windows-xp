import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { XPButton } from '../components/XPButton';
import { XPProgressBar } from '../components/XPProgressBar';
import { XPCheckbox } from '../components/XPCheckbox';
import { XPTextInput } from '../components/XPTextInput';
import XPIcon from '../components/XPIcon';
import { resolveOSTheme } from '../themes/useOSTheme';
import { useApp } from '../hooks/useApp';
import { useXPEventBus } from '../context/EventBusContext';
import { useFileSystem } from '../context/FileSystemContext';
import { useInstalledApps } from '../context/InstalledAppsContext';
import { isContainerNode, type FileNode } from '../types';

export interface SetupWizardProduct {
  /** i18n key for the product name. */
  nameKey: string;
  /** XPIcon name. */
  icon?: string;
  publisher?: string;
  version?: string;
}

export type SetupWizardPageType = 'welcome' | 'license' | 'path' | 'progress' | 'finish';

export interface SetupWizardPage {
  type: SetupWizardPageType;
  /** For 'license' page: i18n key for license text. */
  licenseKey?: string;
  /** For 'path' page: default install path. */
  defaultPath?: string;
}

export interface SetupWizardInstalls {
  /** Filesystem nodes to create under the install path. */
  files?: Record<string, FileNode>;
  /** Start menu entry. */
  startMenu?: { nameKey: string; app: string };
  /** Whether to create a desktop shortcut. */
  desktopShortcut?: boolean;
}

export interface SetupWizardOption {
  id: string;
  labelKey: string;
  default: boolean;
}

export interface SetupWizardSpec {
  product: SetupWizardProduct;
  pages: (SetupWizardPageType | SetupWizardPage)[];
  installs: SetupWizardInstalls;
  options?: SetupWizardOption[];
}

interface SetupWizardProps {
  spec?: SetupWizardSpec;
  windowId?: string;
}

const INSTALL_DURATION_MS = 2000;
const INSTALL_TICK_MS = 50;

const normalizePage = (page: SetupWizardPageType | SetupWizardPage): SetupWizardPage =>
  typeof page === 'string' ? { type: page } : page;

const pathToSegments = (path: string): string[] =>
  path
    .split(/[\\/]+/)
    .map(part => part.trim())
    .filter(Boolean);

/** Leaf/branch names under `files`, in tree order, for the "Copying: X" ticker. */
const collectEntryNames = (entries: Record<string, FileNode>): string[] => {
  const names: string[] = [];
  for (const [name, node] of Object.entries(entries)) {
    names.push(name);
    if (isContainerNode(node)) names.push(...collectEntryNames(node.children));
  }
  return names;
};

const Root = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  font-family: ${({ theme }) => resolveOSTheme(theme).fonts.UI};
  font-size: 11px;
  color: ${({ theme }) => resolveOSTheme(theme).tokens.BLACK};
  background: ${({ theme }) => resolveOSTheme(theme).tokens.SURFACE};
`;

const Body = styled.div`
  flex: 1;
  display: flex;
  min-height: 0;
`;

const SidePanel = styled.div`
  flex-shrink: 0;
  width: 140px;
  background: ${({ theme }) => resolveOSTheme(theme).tokens.SIDEBAR_GRADIENT};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px 12px;
  box-sizing: border-box;
  color: ${({ theme }) => resolveOSTheme(theme).tokens.WHITE};
  text-align: center;
`;

const SideProduct = styled.div`
  font-weight: bold;
  font-size: 12px;
  line-height: 1.3;
`;

const ContentPanel = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => resolveOSTheme(theme).tokens.WHITE};
  padding: 16px;
  box-sizing: border-box;
  overflow: auto;
`;

const PageTitle = styled.h2`
  margin: 0 0 12px;
  font-size: 13px;
  font-weight: bold;
`;

const PageMessage = styled.p`
  margin: 0 0 12px;
  line-height: 1.5;
`;

const LicenseBox = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  border: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.FIELD_BORDER};
  background: ${({ theme }) => resolveOSTheme(theme).tokens.WHITE};
  padding: 8px;
  white-space: pre-wrap;
  line-height: 1.4;
  margin-bottom: 12px;
`;

const PathRow = styled.div`
  display: flex;
  gap: 6px;
  align-items: center;
`;

const CopyingLine = styled.div`
  margin-top: 16px;
  min-height: 14px;
  color: ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_SHADOW};
`;

const ButtonBar = styled.div`
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-top: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.BORDER_GREY};
`;

const EMPTY_SPEC: SetupWizardSpec = {
  product: { nameKey: 'setup.welcomeTitle' },
  pages: ['welcome', 'finish'],
  installs: {},
};

const SetupWizard: React.FC<SetupWizardProps> = ({ spec: rawSpec, windowId }) => {
  const { t } = useTranslation();
  const app = useApp(windowId);
  const bus = useXPEventBus();
  const fileSystem = useFileSystem();
  const { install: registerProduct } = useInstalledApps();

  const spec = rawSpec ?? EMPTY_SPEC;
  const pages = useMemo(() => spec.pages.map(normalizePage), [spec.pages]);
  const [pageIndex, setPageIndex] = useState(0);
  const currentPage = pages[pageIndex] ?? pages[pages.length - 1];

  const [accepted, setAccepted] = useState(false);
  const [installPath, setInstallPath] = useState(
    pages.find(p => p.type === 'path')?.defaultPath ?? ''
  );
  const [progress, setProgress] = useState(0);
  const [installing, setInstalling] = useState(false);
  const installStartedRef = useRef(false);

  const productName = t(spec.product.nameKey);
  const appId = spec.installs.startMenu?.app ?? spec.product.nameKey;

  const entryNames = useMemo(
    () => collectEntryNames(spec.installs.files ?? {}),
    [spec.installs.files]
  );
  const currentEntryName =
    entryNames.length > 0
      ? entryNames[
          Math.min(entryNames.length - 1, Math.floor((progress / 100) * entryNames.length))
        ]
      : productName;

  const runInstall = useCallback(() => {
    const segments = pathToSegments(installPath);
    for (let i = 0; i < segments.length; i++) {
      const parent = segments.slice(0, i);
      const name = segments[i];
      if (!fileSystem.getFile([...parent, name])) {
        fileSystem.createFile(parent, name, 'folder');
      }
    }

    const fileNames: string[] = [];
    for (const [name, node] of Object.entries(spec.installs.files ?? {})) {
      const { name: _name, ...properties } = node;
      void _name;
      fileSystem.createFile(segments, name, isContainerNode(node) ? 'folder' : 'file', properties);
      fileNames.push(name);
    }

    registerProduct({
      id: appId,
      nameKey: spec.product.nameKey,
      icon: spec.product.icon,
      publisher: spec.product.publisher,
      version: spec.product.version,
      installedAt: new Date().toISOString(),
      installPath: segments,
      startMenu: spec.installs.startMenu,
      hasDesktopShortcut: spec.installs.desktopShortcut ?? false,
      installedFiles: fileNames,
    });
  }, [fileSystem, installPath, spec, appId, registerProduct]);

  useEffect(() => {
    if (currentPage.type !== 'progress' || installStartedRef.current) return;
    installStartedRef.current = true;
    setInstalling(true);
    setProgress(0);
    bus.emit({ type: 'install:start', appId });

    const startedAt = { ticks: 0 };
    const totalTicks = INSTALL_DURATION_MS / INSTALL_TICK_MS;
    const timer = setInterval(() => {
      startedAt.ticks += 1;
      const ratio = Math.min(1, startedAt.ticks / totalTicks);
      setProgress(Math.round(ratio * 100));
      if (ratio >= 1) {
        clearInterval(timer);
        runInstall();
        setInstalling(false);
        bus.emit({ type: 'install:complete', appId });
        setPageIndex(index => Math.min(index + 1, pages.length - 1));
      }
    }, INSTALL_TICK_MS);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage.type]);

  const handleCancel = useCallback(() => {
    bus.emit({ type: 'install:cancelled', appId });
    app.window.close();
  }, [bus, appId, app]);

  const handleFinish = useCallback(() => {
    app.window.close();
  }, [app]);

  const handleBack = useCallback(() => {
    setPageIndex(index => Math.max(0, index - 1));
  }, []);

  const handleNext = useCallback(() => {
    setPageIndex(index => Math.min(index + 1, pages.length - 1));
  }, [pages.length]);

  const nextDisabled =
    installing || (currentPage.type === 'license' && !accepted) || currentPage.type === 'progress';
  const backDisabled = installing || currentPage.type === 'progress' || pageIndex === 0;
  const cancelDisabled = installing;

  return (
    <Root>
      <Body>
        <SidePanel>
          {spec.product.icon && <XPIcon name={spec.product.icon} size={48} />}
          <SideProduct>{productName}</SideProduct>
        </SidePanel>
        <ContentPanel>
          {currentPage.type === 'welcome' && (
            <>
              <PageTitle>{t('setup.welcomeTitle', { product: productName })}</PageTitle>
              <PageMessage>{t('setup.welcomeMessage', { product: productName })}</PageMessage>
            </>
          )}

          {currentPage.type === 'license' && (
            <>
              <PageTitle>{t('setup.licenseTitle')}</PageTitle>
              <LicenseBox>{currentPage.licenseKey ? t(currentPage.licenseKey) : ''}</LicenseBox>
              <XPCheckbox
                checked={accepted}
                onChange={e => setAccepted(e.target.checked)}
                label={t('setup.licenseAccept')}
              />
            </>
          )}

          {currentPage.type === 'path' && (
            <>
              <PageTitle>{t('setup.pathTitle')}</PageTitle>
              <PageMessage>{t('setup.pathLabel')}</PageMessage>
              <PathRow>
                <XPTextInput value={installPath} onChange={e => setInstallPath(e.target.value)} />
                <XPButton type="button">{t('setup.browse')}</XPButton>
              </PathRow>
            </>
          )}

          {currentPage.type === 'progress' && (
            <>
              <PageTitle>{t('setup.progressTitle')}</PageTitle>
              <XPProgressBar value={progress} max={100} />
              <CopyingLine>{t('setup.copying', { file: currentEntryName })}</CopyingLine>
            </>
          )}

          {currentPage.type === 'finish' && (
            <>
              <PageTitle>{t('setup.finishTitle')}</PageTitle>
              <PageMessage>{t('setup.finishMessage', { product: productName })}</PageMessage>
            </>
          )}
        </ContentPanel>
      </Body>

      <ButtonBar>
        {currentPage.type === 'finish' ? (
          <XPButton type="button" $default onClick={handleFinish}>
            {t('setup.finish')}
          </XPButton>
        ) : (
          <>
            <XPButton type="button" onClick={handleBack} disabled={backDisabled}>
              {t('setup.back')}
            </XPButton>
            <XPButton type="button" $default onClick={handleNext} disabled={nextDisabled}>
              {t('setup.next')}
            </XPButton>
            <XPButton type="button" onClick={handleCancel} disabled={cancelDisabled}>
              {t('setup.cancel')}
            </XPButton>
          </>
        )}
      </ButtonBar>
    </Root>
  );
};

export default SetupWizard;
