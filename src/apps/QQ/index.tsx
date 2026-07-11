import React from 'react';
import QQClient from './QQClient';
import QQChat from './QQChat';

/**
 * QQ Messenger（#119）—— **单一应用**（appId `'QQ'`），不拆成多个注册项。
 *
 * 同一注册项按 props 分发视图：
 *   - `view='chat'` + `buddyId` → 聊天窗口；
 *   - 其余 → 客户端主流程（登录 → 登录中 → 主面板，同窗变形）。
 *
 * 主面板与各聊天窗口共用 appId `'QQ'` 与同一份运行时 store（`qqStore`），
 * 刷新后按持久化的 `componentProps` 精确还原。
 */
export interface QQProps {
  windowId?: string;
  /** 视图分发标识（持久化用）。 */
  view?: 'client' | 'chat';
  /** `view='chat'` 时的聊天对象。 */
  buddyId?: string;
  /** 「版本过低」彩蛋开关（默认关闭）。 */
  versionEgg?: boolean;
}

const QQ: React.FC<QQProps> = ({ view, buddyId, windowId, versionEgg }) => {
  if (view === 'chat' && buddyId) {
    return <QQChat buddyId={buddyId} windowId={windowId} />;
  }
  return <QQClient windowId={windowId} versionEgg={versionEgg} />;
};

export default QQ;
