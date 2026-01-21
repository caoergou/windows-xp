import React from 'react';
import Tieba from './Tieba';
import QZone from './QZone';

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

export const qzonePlugin = (url, navigateTo) => {
    if (!url) return null;

    // Match http://qzone.qq.com/[id] or qzone://[id]
    if (url.includes('qzone.qq.com') || url.startsWith('qzone://')) {
        let userId = null;
        if (url.startsWith('qzone://')) {
            userId = url.replace('qzone://', '').split('/')[0];
        } else {
            // http://qzone.qq.com/10001
            const parts = url.replace(/^https?:\/\//, '').split('/');
            // parts[0] is domain, parts[1] is id
            if (parts[1]) userId = parts[1];
        }

        if (userId) {
            return <QZone userId={userId} />;
        }
    }
    return null;
};

export const defaultPlugin = (url, navigateTo) => {
    const t = tiebaPlugin(url, navigateTo);
    if (t) return t;
    const q = qzonePlugin(url, navigateTo);
    if (q) return q;
    return null;
};
