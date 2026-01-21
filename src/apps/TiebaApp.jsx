import React from 'react';
import InternetExplorer from './InternetExplorer';
import { defaultPlugin } from './BrowserPlugins';

const TiebaApp = ({ initialUrl }) => {
    return <InternetExplorer url={initialUrl} plugin={defaultPlugin} />;
}

export default TiebaApp;
