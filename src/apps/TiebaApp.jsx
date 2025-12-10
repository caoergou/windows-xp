import React from 'react';
import InternetExplorer from './InternetExplorer';
import Tieba from './Tieba';

export const tiebaPlugin = (url, navigateTo) => {
    if (!url) return null;

    // Handle tieba.com and tieba.baidu.com
    if (url.includes('tieba.com') || url.includes('tieba.baidu.com')) {
         // URL parsing: http://tieba.com/[tieba_name] or http://tieba.com/[tieba_name]/p/[thread_id]
         // Remove protocol
         const cleanUrl = url.replace(/^https?:\/\//, '');
         const parts = cleanUrl.split('/').filter(p => p && p !== '');

         // parts[0] is domain
         // parts[1] is tiebaId
         // parts[2] is 'p' (optional)
         // parts[3] is threadId (optional)

         let tiebaId = parts[1];
         let threadId = null;

         if (parts[2] === 'p' && parts[3]) {
             threadId = parseInt(parts[3], 10);
         }

         if (!tiebaId || tiebaId === 'tieba.com' || tiebaId === 'tieba.baidu.com') {
             // No specific tieba selected
             return <div style={{padding: 20}}>欢迎来到百度贴吧。请输入具体的贴吧地址。</div>;
         }

         return <Tieba tiebaId={tiebaId} threadId={threadId} currentUrl={url} navigateTo={navigateTo} />;
    }
    return null;
};

const TiebaApp = ({ initialUrl }) => {
    return <InternetExplorer url={initialUrl} plugin={tiebaPlugin} />;
}

export default TiebaApp;
