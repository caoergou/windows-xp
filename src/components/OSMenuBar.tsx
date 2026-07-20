import React from 'react';
import { useOSPackage } from '../os/OSPackageContext';
import type { AppMenu } from '../os/contract';

export interface OSMenuBarProps {
  menus: AppMenu[];
  onCommand: (commandId: string) => void;
}

/** Render app-declared menu data in the active OS package's menu surface. */
const OSMenuBar: React.FC<OSMenuBarProps> = props => {
  const { chrome } = useOSPackage();
  return <chrome.MenuBar {...props} />;
};

export default OSMenuBar;
