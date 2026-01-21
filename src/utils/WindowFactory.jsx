import React from 'react';
import Explorer from '../apps/Explorer';
import InternetExplorer from '../apps/InternetExplorer';
import QQ from '../apps/QQ';
import Notepad from '../apps/Notepad';
import PhotoViewer from '../apps/PhotoViewer';
import Email from '../apps/Email';
import TiebaApp from '../apps/TiebaApp';
import QZone from '../apps/QZone';
import FileProperties from '../components/FileProperties';
import { defaultPlugin } from '../apps/BrowserPlugins';

export const restoreComponent = (appId, componentProps = {}) => {
  // Heuristics based on componentProps if appId is generic or file-based

  // Explorer
  if (componentProps.initialPath) {
    return <Explorer {...componentProps} />;
  }

  // Internet Explorer
  if (appId === 'Internet Explorer' || componentProps.url || componentProps.html) {
    // Determine if it's TiebaApp specific
    if (appId.startsWith('Tieba') || componentProps.initialUrl) {
       // Wait, TiebaApp uses initialUrl
       if (componentProps.initialUrl) return <TiebaApp {...componentProps} />;
       // Fallback to IE with plugin
       return <InternetExplorer {...componentProps} plugin={defaultPlugin} />;
    }
    return <InternetExplorer {...componentProps} plugin={defaultPlugin} />;
  }

  // Notepad
  if (componentProps.content !== undefined && !componentProps.url && !componentProps.html) {
      return <Notepad {...componentProps} />;
  }

  // Photo Viewer
  if (appId === 'PhotoViewer' || (componentProps.src && appId !== 'Internet Explorer')) {
      return <PhotoViewer {...componentProps} />;
  }

  // QQ
  if (appId === 'QQ') {
      return <QQ {...componentProps} />;
  }

  // Outlook / Email
  if (appId === 'Outlook Express' || appId === 'Email') {
      return <Email {...componentProps} />;
  }

  // Tieba App explicitly
  if (appId.includes('Tieba') && componentProps.initialUrl) {
      return <TiebaApp {...componentProps} />;
  }

  // QZone - Restoring logic
  if (appId.startsWith('qzone-')) {
      // If we are here, it might be restoring a window that was previously opened.
      // We now want to restore it as an IE window containing QZone, not the raw QZone component.
      const userId = appId.split('-')[1];
      return <InternetExplorer url={`http://qzone.qq.com/${userId}`} plugin={defaultPlugin} />;
  }

  // File Properties
  if (appId.startsWith('properties-')) {
      return <FileProperties {...componentProps} />;
  }

  // Fallback for specific IDs if props are missing (e.g. empty Explorer)
  if (appId === 'My Computer' || appId === 'Recycle Bin' || appId === 'My Documents') {
       // Should have had initialPath, but if not, default to root?
       // Better to default to appId as path if valid?
       return <Explorer initialPath={[appId]} />;
  }

  console.warn(`Unknown appId for restoration: ${appId}`, componentProps);
  return null;
};
