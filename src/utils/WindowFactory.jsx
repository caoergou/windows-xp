import React from 'react';
import Explorer from '../apps/Explorer';
import InternetExplorer from '../apps/InternetExplorer';
import Notepad from '../apps/Notepad';
import PhotoViewer from '../apps/PhotoViewer';
import FileProperties from '../components/FileProperties';

export const restoreComponent = (appId, componentProps = {}) => {
  // Explorer
  if (componentProps.initialPath) {
    return <Explorer {...componentProps} />;
  }

  // Internet Explorer
  if (appId === 'Internet Explorer' || componentProps.url || componentProps.html) {
    return <InternetExplorer {...componentProps} />;
  }

  // Notepad
  if (componentProps.content !== undefined && !componentProps.url && !componentProps.html) {
    return <Notepad {...componentProps} />;
  }

  // Photo Viewer
  if (appId === 'PhotoViewer' || (componentProps.src && appId !== 'Internet Explorer')) {
    return <PhotoViewer {...componentProps} />;
  }

  // File Properties
  if (appId.startsWith('properties-')) {
    return <FileProperties {...componentProps} />;
  }

  // Common folders
  if (['My Computer', '我的电脑', 'Recycle Bin', '回收站', 'My Documents', '我的文档'].includes(appId)) {
    return <Explorer initialPath={[appId]} />;
  }

  console.warn(`Unknown appId for restoration: ${appId}`, componentProps);
  return null;
};
