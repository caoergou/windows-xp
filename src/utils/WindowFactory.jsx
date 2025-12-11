import React from 'react';
import Explorer from '../apps/Explorer';
import InternetExplorer from '../apps/InternetExplorer';
import QQ from '../apps/QQ';
import Notepad from '../apps/Notepad';
import Email from '../apps/Email';
import TiebaApp, { tiebaPlugin } from '../apps/TiebaApp';

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
       return <InternetExplorer {...componentProps} plugin={tiebaPlugin} />;
    }
    return <InternetExplorer {...componentProps} plugin={tiebaPlugin} />;
  }

  // Notepad
  if (componentProps.content !== undefined && !componentProps.url && !componentProps.html) {
      return <Notepad {...componentProps} />;
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

  // Fallback for specific IDs if props are missing (e.g. empty Explorer)
  if (appId === 'My Computer' || appId === 'Recycle Bin' || appId === 'My Documents') {
       // Should have had initialPath, but if not, default to root?
       // Better to default to appId as path if valid?
       return <Explorer initialPath={[appId]} />;
  }

  console.warn(`Unknown appId for restoration: ${appId}`, componentProps);
  return null;
};
