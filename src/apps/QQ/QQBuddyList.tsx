import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { PanelRoot, BuddyTooltip } from './styles';
import { qqImg, qqAvatar } from './assets';
import { qqStore } from './qqStore';
import { useQQStore } from './useQQStore';
import { useWindowManagerActions } from '../../context/WindowManagerContext';
import { APP_REGISTRY } from '../../registry/apps';
import ContextMenu from '../../components/ContextMenu';
import { QQ_STATUS_LABEL, QQ_SELECTABLE_STATUS } from './statusMeta';
import QQFindDialog from './QQFindDialog';
import type { MenuItem } from '../../types';
import type { RuntimeBuddy } from './qqStore';
import type { QQStatus } from '../../data/qq/types';

/**
 * QQ 主面板（好友列表窗口）—— 逐元素还原 QQ2006：个人横幅、左侧面板栏、
 * 分组手风琴（在线/总数计数）、单列好友条目（灰度离线 / 红名会员 / 业务角标）、
 * 底部业务工具栏与「菜单 / 查找」。渲染在引擎 XP 窗框内（拖动 / 关闭由窗框提供）。
 *
 * 交互（#refine-qq）：好友悬停浮出资料卡（昵称/号码/状态/签名）；底部「查找」与
 * 「菜单→查找联系人」打开查找对话框；「菜单」「更改状态」用引擎共享 ContextMenu。
 */

const badgeClass: Record<string, string> = {
  music: 'qq-icon-music',
  ring: 'qq-icon-ring',
  mobile: 'qq-icon-mobile',
};

/** 状态圆点颜色（CSS 关键字，避免内联 hex）。 */
const STATUS_DOT: Record<QQStatus, string> = {
  online: 'limegreen',
  away: 'orange',
  busy: 'red',
  invisible: 'gray',
  offline: 'silver',
};

const PANEL_BAR: Array<{ img: string; title: string; active?: boolean }> = [
  { img: 'panel-bar/FriendButton.png', title: 'QQ好友面板', active: true },
  { img: 'panel-bar/SBuddyButton.png', title: '互动空间' },
  { img: 'panel-bar/MobileButton.png', title: '我的无线乐园' },
  { img: 'panel-bar/RtxButton.png', title: '企业好友面板' },
  { img: 'panel-bar/ContentsButton.png', title: '网络杂志面板' },
  { img: 'panel-bar/CustomButton.png', title: '用户自定义面板' },
  { img: 'panel-bar/EaseButton.png', title: '音乐中心' },
  { img: 'panel-bar/NetDiskButton.png', title: '网络硬盘' },
  { img: 'panel-bar/IntegratePanel.png', title: '综合业务面板' },
  { img: 'panel-bar/BlankPanel.png', title: '面板管理器' },
];

const TOOLBAR_BTNS: Array<{ img: string; title: string; url?: string }> = [
  { img: 'MobileMsgButton.png', title: '发送手机消息' },
  { img: 'GameButton.png', title: 'QQ游戏', url: 'https://web.archive.org/web/20061205080044/http://game.qq.com/' },
  { img: 'TTButton.png', title: '腾讯TT浏览器', url: 'https://web.archive.org/web/20061017120334/http://im.qq.com/tt/' },
  { img: 'QQHome.png', title: 'QQ空间', url: 'https://web.archive.org/web/20061214025556/http://qzone.qq.com/' },
  { img: 'QQMusicButton.png', title: 'QQ音乐', url: 'https://web.archive.org/web/20061205/http://music.qq.com/' },
  { img: 'QQTVButton.png', title: '网络电视(QQLive)', url: 'https://web.archive.org/web/20061020082618/http://www.qqlive.com/' },
  { img: 'OpenPet.png', title: 'QQ宠物', url: 'https://web.archive.org/web/20061105063630/http://pet.qq.com/' },
];

interface QQBuddyListProps {
  /** 打开与某好友的聊天窗口。 */
  onOpenChat: (buddyId: string) => void;
  /** 退出 QQ（关闭主面板 + 所有聊天窗 + 重置运行时）。 */
  onExit: () => void;
}

interface HoverInfo {
  buddy: RuntimeBuddy;
  x: number;
  y: number;
}

const QQBuddyList: React.FC<QQBuddyListProps> = ({ onOpenChat, onExit }) => {
  const state = useQQStore();
  const { me, groups, buddies, openGroups, unread } = state;
  const { openWindow } = useWindowManagerActions();

  const [hover, setHover] = useState<HoverInfo | null>(null);
  const [findOpen, setFindOpen] = useState(false);
  const [menu, setMenu] = useState<{ x: number; y: number; items: MenuItem[] } | null>(null);

  const openInIE = (url: string, title: string) => {
    const ie = APP_REGISTRY.InternetExplorer;
    if (!ie) return;
    openWindow('InternetExplorer', title, ie.restore({ url }), ie.icon, {
      isMaximized: true,
      componentProps: { url },
    });
  };

  const buddiesOf = (groupId: string): RuntimeBuddy[] =>
    buddies.filter(b => b.group === groupId);

  const showTooltip = (e: React.MouseEvent, buddy: RuntimeBuddy) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    // 浮出到条目右侧；贴近屏幕右缘时翻到左侧，避免被裁切。
    const width = 210;
    const x = rect.right + width + 8 > window.innerWidth ? rect.left - width - 4 : rect.right + 4;
    setHover({ buddy, x: Math.max(4, x), y: rect.top });
  };

  // 状态切换菜单（横幅「更改状态」按钮 / 头像）。
  const openStatusMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setMenu({
      x: rect.left,
      y: rect.bottom,
      items: QQ_SELECTABLE_STATUS.map(s => ({
        label: `${me?.status === s ? '● ' : '　'}${QQ_STATUS_LABEL[s]}`,
        action: () => qqStore.setMeStatus(s),
      })),
    });
  };

  // 主菜单（底部「菜单」按钮）。装饰性条目置灰，可用项：查找联系人、退出。
  const openMainMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const items: MenuItem[] = [
      { label: '查找联系人…', action: () => setFindOpen(true) },
      { label: '我的资料', disabled: true },
      { label: '系统设置', disabled: true },
      { label: '消息记录管理器', disabled: true },
      { label: '帮助', disabled: true },
      { type: 'separator' },
      { label: '退出', action: onExit },
    ];
    // 菜单向上弹出（贴底部工具栏）：ContextMenu 会在超出视口时自动上翻。
    setMenu({ x: rect.left, y: rect.top, items });
  };

  return (
    <PanelRoot data-testid="qq-panel">
      {/* 个人信息横幅 */}
      <div className="qq-head">
        <div className="qq-flex-bg">
          <div className="qq-head-left" />
          <div className="qq-head-center" />
          <div className="qq-head-right" />
        </div>
        <div
          className="qq-status-pic"
          title="更改状态"
          style={{ backgroundImage: `url(${qqAvatar(me?.avatar ?? 50)})` }}
          onClick={openStatusMenu}
        />
        <button className="qq-status-btn" title="更改状态" onClick={openStatusMenu} />
        <label className="qq-num" data-testid="qq-me-nick">
          {me ? `${me.nickname}(${QQ_STATUS_LABEL[me.status] ?? '在线'})` : ''}
        </label>
        <div className="qq-head-btns">
          <button title="收发邮件">
            <img src={qqImg('MailButton.png')} alt="mail" />
            <label>(0)</label>
          </button>
          <button title="安全中心">
            <img src={qqImg('security_normal.png')} alt="security" />
          </button>
          <button title="我的钱包">
            <img src={qqImg('payment.png')} alt="wallet" />
          </button>
        </div>
      </div>

      {/* 主体区：面板栏 + 好友盒 */}
      <div className="qq-body">
        <div className="qq-flex-bg">
          <div className="qq-body-left" />
          <div className="qq-body-center" />
          <div className="qq-body-right" />
        </div>

        <div className="qq-panel-bar">
          {PANEL_BAR.map((b, i) => (
            <button key={i} className={b.active ? 'active' : ''} title={b.title}>
              <img src={qqImg(b.img)} alt="" />
            </button>
          ))}
        </div>

        <div className="qq-friend-box">
          <button className="qq-btn">QQ好友</button>
          <div className="qq-friend-list">
            {groups.map(group => {
              const members = buddiesOf(group.id);
              const online = members.filter(b => b.currentStatus !== 'offline').length;
              const isOpen = !!openGroups[group.id];
              return (
                <React.Fragment key={group.id}>
                  <div
                    className={`qq-friend-group${isOpen ? ' on' : ''}`}
                    data-testid={`qq-group-${group.id}`}
                    onClick={() => qqStore.toggleGroup(group.id)}
                  >
                    {group.system ? group.name : `${group.name}(${online}/${members.length})`}
                  </div>
                  {isOpen &&
                    members.map(buddy => {
                      const offline = buddy.currentStatus === 'offline';
                      const hasUnread = (unread[buddy.id] ?? 0) > 0;
                      return (
                        <div
                          key={buddy.id}
                          className={
                            'qq-friend-item' +
                            (buddy.vip ? ' qq-vip' : '') +
                            (offline ? ' qq-offline' : '') +
                            (hasUnread ? ' has-unread' : '')
                          }
                          data-testid={`qq-buddy-${buddy.id}`}
                          onDoubleClick={() => onOpenChat(buddy.id)}
                          onMouseEnter={e => showTooltip(e, buddy)}
                          onMouseLeave={() => setHover(null)}
                        >
                          <img className="qq-friend-avatar" src={qqAvatar(buddy.avatar)} alt="" />
                          <div className="qq-friend-info">
                            <p className="qq-friend-name">{buddy.nickname}</p>
                            <p className="qq-friend-motto">{buddy.signature || ' '}</p>
                            <div className="qq-friend-icons">
                              {(buddy.badges ?? []).map(b => (
                                <div key={b} className={badgeClass[b]} />
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </React.Fragment>
              );
            })}
          </div>
          <button className="qq-btn">手机好友</button>
          <button className="qq-btn">群/校友录</button>
          <button className="qq-btn">最近联系人</button>
        </div>
      </div>

      {/* 底部工具栏 */}
      <div className="qq-toolbar">
        <div className="qq-flex-bg">
          <div className="qq-toolbar-left" />
          <div className="qq-toolbar-center" />
          <div className="qq-toolbar-right" />
        </div>
        <div className="qq-toolbar-btns">
          {TOOLBAR_BTNS.map((b, i) => (
            <button
              key={i}
              title={b.title}
              style={{ backgroundImage: `url(${qqImg(b.img)})` }}
              onClick={() => b.url && openInIE(b.url, b.title)}
            />
          ))}
        </div>
        <button className="qq-menu-button" title="菜单" data-testid="qq-menu-button" onClick={openMainMenu} />
        <div className="qq-toolbar-btns qq-toolbar-2">
          <button
            className="qq-msgmgr-button"
            title="信息管理器"
            style={{ backgroundImage: `url(${qqImg('MsgManagerButton.png')})` }}
          />
          <button
            className="qq-search-button"
            title="查找用户"
            data-testid="qq-find-button"
            onClick={() => setFindOpen(true)}
          >
            查找
          </button>
        </div>
      </div>

      {/* 好友悬停资料卡 */}
      {hover &&
        createPortal(
          <BuddyTooltip data-testid="qq-buddy-tooltip" style={{ left: hover.x, top: hover.y }}>
            <div className="bt-head">
              <img src={qqAvatar(hover.buddy.avatar)} alt="" />
              <div>
                <div className={`bt-name${hover.buddy.vip ? ' vip' : ''}`}>{hover.buddy.nickname}</div>
                <div className="bt-num">{hover.buddy.number}</div>
              </div>
            </div>
            <div className="bt-body">
              <div className="bt-status">
                <span className="dot" style={{ background: STATUS_DOT[hover.buddy.currentStatus] }} />
                {QQ_STATUS_LABEL[hover.buddy.currentStatus]}
              </div>
              <div className="bt-sign">{hover.buddy.signature || '这个人很懒，什么都没留下'}</div>
            </div>
          </BuddyTooltip>,
          document.body
        )}

      {menu && (
        <ContextMenu
          visible
          x={menu.x}
          y={menu.y}
          menuItems={menu.items}
          onClose={() => setMenu(null)}
        />
      )}

      {findOpen && (
        <QQFindDialog
          buddies={buddies}
          onOpenChat={onOpenChat}
          onClose={() => setFindOpen(false)}
        />
      )}
    </PanelRoot>
  );
};

export default QQBuddyList;
