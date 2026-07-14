import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { XPCheckbox } from '../components/XPCheckbox';
import {
  XPMenuBar as SharedMenuBar,
  XPMenuBarItem as SharedMenuButton,
  XPMenuSlot as SharedMenuSlot,
  XPMenuDropdown as SharedDropdown,
  XPMenuDropdownItem as SharedDropdownItem,
  XPMenuSeparator as SharedMenuSeparator,
  XPMenuMark as SharedMenuMark,
} from '../components/XPMenuBar';
import { xpTrackbarStyles } from '../theme';
import { COLORS } from '../constants';
import { getVolume, setVolume, getMuted, setMuted } from '../utils/soundManager';
import { useWindowManagerActions } from '../context/WindowManagerContext';
import { useModal } from '../context/ModalContext';
import { useStorage } from '../context/StorageContext';

// The full Volume Control (sndvol32) mixer: a menu bar over a row of channel
// columns (Volume Control / Wave / SW Synth / CD Audio), each with a balance
// slider, a tall vertical volume slider and a mute checkbox. Only the master
// "Volume Control" channel is wired to the sound manager; the rest keep their
// state locally (persisted) with no real audio effect.

const Root = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: ${COLORS.SURFACE};
  font-family: 'Tahoma', 'SimSun', 'Microsoft YaHei', sans-serif;
  font-size: 11px;
  color: ${COLORS.BLACK};
`;

// Etched groove separating the menu bar from the mixer body (as in sndvol32).
const MenuGroove = styled.div`
  height: 2px;
  flex-shrink: 0;
  border-top: 1px solid ${COLORS.BUTTON_SHADOW};
  border-bottom: 1px solid ${COLORS.BUTTON_HIGHLIGHT};
`;

const Columns = styled.div`
  display: flex;
  align-items: stretch;
  flex: 1;
  padding: 8px 4px;
`;

const Column = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 8px;
  gap: 6px;
`;

// Thin vertical etched rule between channels.
const Rule = styled.div`
  width: 2px;
  align-self: stretch;
  border-left: 1px solid ${COLORS.BUTTON_SHADOW};
  border-right: 1px solid ${COLORS.BUTTON_HIGHLIGHT};
`;

const ColumnTitle = styled.div`
  font-weight: bold;
  text-align: center;
  align-self: stretch;
  white-space: nowrap;
`;

const FieldLabel = styled.div`
  align-self: flex-start;
  line-height: 12px;
`;

// A short horizontal balance slider with L/R speaker affordances.
const BalanceRow = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
`;

const Speaker = styled.span`
  font-size: 10px;
  line-height: 1;
  color: ${COLORS.BLACK};
`;

const BalanceSlider = styled.input`
  ${xpTrackbarStyles}
  width: 56px;
`;

// Vertical volume slider: a horizontal xp trackbar rotated so max sits at top,
// wrapped in a box reserving the rotated footprint.
const VolumeBox = styled.div`
  position: relative;
  width: 26px;
  height: 96px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const VolumeSlider = styled.input`
  ${xpTrackbarStyles}
  width: 96px;
  transform: rotate(-90deg);
`;

interface ChannelState {
  volume: number;
  balance: number;
  muted: boolean;
}

type ChannelId = 'wave' | 'swSynth' | 'cd';

const LOCAL_CHANNELS: ChannelId[] = ['wave', 'swSynth', 'cd'];
const STORAGE_KEY = 'sndvol_channels';

const DEFAULT_CHANNELS: Record<ChannelId, ChannelState> = {
  wave: { volume: 75, balance: 50, muted: false },
  swSynth: { volume: 75, balance: 50, muted: false },
  cd: { volume: 75, balance: 50, muted: false },
};

interface OptionItem {
  key: string;
  label: string;
  disabled?: boolean;
  onSelect?: () => void;
}

interface MenuDef {
  id: 'options' | 'help';
  label: string;
  items: (OptionItem | 'separator')[];
}

const VolumeControl = ({ windowId }: { windowId?: string }) => {
  const { t, i18n } = useTranslation();
  const { closeWindow, setWindowTitle } = useWindowManagerActions();
  const { showModal } = useModal();
  const storage = useStorage();

  // Master channel — wired to the global sound manager.
  const [masterVolume, setMasterVolume] = useState<number>(getVolume());
  const [masterBalance, setMasterBalance] = useState<number>(50);
  const [masterMuted, setMasterMuted] = useState<boolean>(getMuted());

  // Secondary channels — local, persisted, no real audio effect.
  const [channels, setChannels] = useState<Record<ChannelId, ChannelState>>(() => {
    const raw = storage.local.getItem(storage.key(STORAGE_KEY));
    if (raw) {
      try {
        return { ...DEFAULT_CHANNELS, ...(JSON.parse(raw) as Record<ChannelId, ChannelState>) };
      } catch {
        return DEFAULT_CHANNELS;
      }
    }
    return DEFAULT_CHANNELS;
  });

  const [openMenu, setOpenMenu] = useState<MenuDef['id'] | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVolume(masterVolume);
  }, [masterVolume]);

  useEffect(() => {
    setMuted(masterMuted);
  }, [masterMuted]);

  useEffect(() => {
    storage.local.setItem(storage.key(STORAGE_KEY), JSON.stringify(channels));
  }, [channels, storage]);

  useEffect(() => {
    if (windowId) setWindowTitle(windowId, t('apps.volumeControl'));
  }, [i18n.language, setWindowTitle, t, windowId]);

  useEffect(() => {
    if (!openMenu) return undefined;
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenu]);

  const updateChannel = useCallback((id: ChannelId, patch: Partial<ChannelState>) => {
    setChannels(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }, []);

  const handleExit = useCallback(() => {
    setOpenMenu(null);
    if (windowId) closeWindow(windowId);
  }, [closeWindow, windowId]);

  const handleAbout = useCallback(() => {
    setOpenMenu(null);
    void showModal(t('volumeControl.about.title'), t('volumeControl.about.message'));
  }, [showModal, t]);

  const menus: MenuDef[] = [
    {
      id: 'options',
      label: t('volumeControl.menu.options'),
      items: [
        { key: 'properties', label: t('volumeControl.menuItems.properties'), disabled: true },
        { key: 'advanced', label: t('volumeControl.menuItems.advancedControls'), disabled: true },
        'separator',
        { key: 'exit', label: t('volumeControl.menuItems.exit'), onSelect: handleExit },
      ],
    },
    {
      id: 'help',
      label: t('volumeControl.menu.help'),
      items: [{ key: 'about', label: t('volumeControl.menuItems.about'), onSelect: handleAbout }],
    },
  ];

  const renderColumn = (
    key: string,
    title: string,
    state: ChannelState,
    onBalance: (v: number) => void,
    onVolume: (v: number) => void,
    onMute: (m: boolean) => void,
    muteLabel: string,
    testids?: { volume?: string; mute?: string }
  ) => (
    <Column>
      <ColumnTitle>{title}</ColumnTitle>
      <FieldLabel>{t('volumeControl.balance')}</FieldLabel>
      <BalanceRow>
        <Speaker aria-hidden="true">◖</Speaker>
        <BalanceSlider
          type="range"
          min="0"
          max="100"
          value={state.balance}
          onChange={e => onBalance(parseInt(e.target.value, 10))}
          aria-label={`${title} ${t('volumeControl.balance')}`}
        />
        <Speaker aria-hidden="true">◗</Speaker>
      </BalanceRow>
      <FieldLabel>{t('volumeControl.volume')}</FieldLabel>
      <VolumeBox>
        <VolumeSlider
          data-testid={testids?.volume}
          type="range"
          min="0"
          max="100"
          value={state.muted ? 0 : state.volume}
          onChange={e => onVolume(parseInt(e.target.value, 10))}
          aria-label={`${title} ${t('volumeControl.volume')}`}
        />
      </VolumeBox>
      <XPCheckbox
        data-testid={testids?.mute}
        checked={state.muted}
        onChange={e => onMute(e.target.checked)}
        label={muteLabel}
      />
    </Column>
  );

  return (
    <Root data-testid="sndvol-mixer">
      <SharedMenuBar ref={menuRef}>
        {menus.map(menu => (
          <SharedMenuSlot key={menu.id}>
            <SharedMenuButton
              type="button"
              $active={openMenu === menu.id}
              onClick={() => setOpenMenu(current => (current === menu.id ? null : menu.id))}
            >
              {menu.label}
            </SharedMenuButton>
            {openMenu === menu.id && (
              <SharedDropdown role="menu">
                {menu.items.map((item, index) =>
                  item === 'separator' ? (
                    <SharedMenuSeparator key={`sep-${index}`} />
                  ) : (
                    <SharedDropdownItem
                      key={item.key}
                      type="button"
                      role="menuitem"
                      $disabled={item.disabled}
                      aria-disabled={item.disabled}
                      onClick={item.disabled ? undefined : item.onSelect}
                    >
                      <SharedMenuMark />
                      {item.label}
                    </SharedDropdownItem>
                  )
                )}
              </SharedDropdown>
            )}
          </SharedMenuSlot>
        ))}
      </SharedMenuBar>
      <MenuGroove />
      <Columns>
        {renderColumn(
          'master',
          t('volumeControl.channels.master'),
          { volume: masterVolume, balance: masterBalance, muted: masterMuted },
          setMasterBalance,
          v => {
            setMasterVolume(v);
            if (masterMuted && v > 0) setMasterMuted(false);
          },
          setMasterMuted,
          t('volumeControl.muteAll'),
          { volume: 'sndvol-master-volume', mute: 'sndvol-master-mute' }
        )}
        {LOCAL_CHANNELS.map(id => (
          <React.Fragment key={id}>
            <Rule />
            {renderColumn(
              id,
              t(`volumeControl.channels.${id}`),
              channels[id],
              v => updateChannel(id, { balance: v }),
              v =>
                updateChannel(id, {
                  volume: v,
                  ...(channels[id].muted && v > 0 ? { muted: false } : {}),
                }),
              m => updateChannel(id, { muted: m }),
              t('volumeControl.mute')
            )}
          </React.Fragment>
        ))}
      </Columns>
    </Root>
  );
};

export default VolumeControl;
