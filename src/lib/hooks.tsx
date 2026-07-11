/**
 * Public hooks for building custom XP applications.
 *
 * All hooks must be used inside the component tree rendered by `<WindowsXP />`
 * or the equivalent providers.
 */

export { useAppRegistry } from '../context/AppRegistryContext';
export { useCulture } from '../context/CultureContext';
export { useFileSystem } from '../context/FileSystemContext';
export { useWindowManager } from '../context/WindowManagerContext';
export { useUserSession } from '../context/UserSessionContext';
export { useModal } from '../context/ModalContext';
export { useTray } from '../context/TrayContext';
export { useScheduler } from '../context/SchedulerContext';
export { useApp } from '../hooks/useApp';
