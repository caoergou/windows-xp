/**
 * Public XP UI components.
 *
 * These can be used independently of the full `<WindowsXP />` desktop,
 * provided they are rendered inside the appropriate providers.
 */

export { default as Window } from '../components/Window';
export { default as WindowChrome } from '../components/Window/WindowChrome';
export { default as WindowControls } from '../components/Window/WindowControls';
export { default as ResizableWrapper } from '../components/Window/ResizableWrapper';
export { default as Desktop } from '../components/Desktop';
export { default as Taskbar } from '../components/Taskbar';
export { default as StartButton } from '../components/Taskbar/StartButton';
export { default as StartMenu } from '../components/Taskbar/StartMenu';
export { default as TaskList } from '../components/Taskbar/TaskList';
export { default as SystemTray } from '../components/Taskbar/SystemTray';
export { default as XPIcon } from '../components/XPIcon';
export { XPButton } from '../components/XPButton';
export {
  XPMenuBar,
  XPMenuBarItem,
  XPMenuSlot,
  XPMenuDropdown,
  XPMenuDropdownItem,
  XPMenuSeparator,
  XPMenuMark,
} from '../components/XPMenuBar';
export { default as XPAlert } from '../components/XPAlert';
export { default as XPConfirm } from '../components/XPConfirm';
export { default as XPInput } from '../components/XPInput';
export { default as BootScreen } from '../components/BootScreen';
export { default as LoginScreen } from '../components/LoginScreen';
export { default as BsodScreen } from '../components/BsodScreen';
export { default as MobileWarning } from '../components/MobileWarning';
export { default as SystemClock } from '../components/SystemClock';
export { default as ContextMenu } from '../components/ContextMenu';
export { default as FileProperties } from '../components/FileProperties';
export { default as DesktopProperties } from '../components/DesktopProperties';
export { default as VolumePopup } from '../components/VolumePopup';
export { default as AntivirusPopup } from '../components/AntivirusPopup';
export { default as ErrorBoundary } from '../components/ErrorBoundary';
export { default as PasswordDialog } from '../components/PasswordDialog';
export { default as StickyNote } from '../components/StickyNote';

// Re-export providers so advanced users can compose their own tree.
export { AppProviders } from '../components/AppProviders';
