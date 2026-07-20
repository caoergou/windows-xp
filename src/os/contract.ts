import type React from 'react';
import type { BootBranding, LoginBranding } from '../branding';
import type { WindowState } from '../types';
import type { OSTheme } from '../themes/contract';

export type MenuModel = 'in-window' | 'global-bar';
export type MinimizeTarget = 'shell-button' | 'dock-icon';
export type MaximizeSemantics = 'fill' | 'zoom';
export type PrimaryModifier = 'ctrl' | 'meta';
export type WindowAnimations = 'caption' | 'none';
export type FocusRules = 'click-to-focus' | 'focus-follows-pointer';
export type DialogModality = 'floating' | 'sheet';

/** Closed behavior decisions understood by the engine. */
export interface BehaviorProfile {
  menuModel: MenuModel;
  minimizeTarget: MinimizeTarget;
  maximizeSemantics: MaximizeSemantics;
  primaryModifier: PrimaryModifier;
  windowAnimations: WindowAnimations;
  focusRules: FocusRules;
  dialogModality: DialogModality;
}

export interface OSConventions {
  pathStyle: 'drive' | 'unix';
  terminalDialect: 'cmd' | 'posix';
  iconSizes: readonly number[];
  defaultWallpaper?: string;
}

export type AppRole = 'files' | 'editor' | 'browser' | 'terminal' | 'media';
export type AppRoleMap = Record<AppRole, string>;

export interface AppMenuItem {
  id: string;
  label: string;
  shortcut?: string;
  disabled?: boolean;
  type?: 'separator';
  items?: AppMenuItem[];
}

export interface AppMenu {
  id: string;
  label: string;
  items: AppMenuItem[];
}

export interface OSMenuBarProps {
  menus: AppMenu[];
  onCommand: (commandId: string) => void;
}

export interface WindowDecorationProps {
  windowState: WindowState;
  isFocused: boolean;
  isResizable: boolean;
  onFocus: () => void;
  onMinimize: (event: React.MouseEvent) => void;
  onMaximize: (event?: React.MouseEvent) => void;
  onClose: (event: React.MouseEvent) => void;
  children: React.ReactNode;
}

export interface BootScreenSlotProps {
  onComplete: () => void;
  branding?: BootBranding;
}

export interface LoginScreenSlotProps {
  branding?: LoginBranding;
}

export interface SystemDialogsProps {
  children: React.ReactNode;
  modality: DialogModality;
}

export interface ChromeSlots {
  WindowDecoration: React.ComponentType<WindowDecorationProps>;
  shellSurfaces: React.ComponentType[];
  Launcher?: React.ComponentType;
  SystemDialogs: React.ComponentType<SystemDialogsProps>;
  BootScreen: React.ComponentType<BootScreenSlotProps>;
  LoginScreen: React.ComponentType<LoginScreenSlotProps>;
  MenuBar: React.ComponentType<OSMenuBarProps>;
}

/** A complete, runtime-selectable operating-system package. */
export interface OSPackage {
  id: string;
  name: string;
  theme: OSTheme;
  chrome: ChromeSlots;
  behavior: BehaviorProfile;
  conventions: OSConventions;
  appRoles?: Partial<AppRoleMap>;
}
