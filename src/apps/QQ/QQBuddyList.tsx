import React from 'react';
import { PanelRoot } from './styles';
import { qqImg, qqAvatar } from './assets';
import { qqStore } from './qqStore';
import { useQQStore } from './useQQStore';
import type { RuntimeBuddy } from './qqStore';

/**
 * QQ 主面板（好友列表窗口）—— 逐元素还原 QQ2006：个人横幅、左侧面板栏、
 * 分组手风琴（在线/总数计数）、单列好友条目（灰度离线 / 红名会员 / 业务角标）、
 * 底部业务工具栏与「菜单 / 查找」。渲染在引擎 XP 窗框内（拖动 / 关闭由窗框提供）。
 */

const badgeClass: Record<string, string> = {
  music: 'qq-icon-music',
  ring: 'qq-icon-ring',
  mobile: 'qq-icon-mobile',
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
  { img: 'GameButton.png', title: 'QQ游戏', url: 'https://game.qq.com/' },
  { img: 'TTButton.png', title: '腾讯TT浏览器', url: 'https://browser.qq.com/' },
  { img: 'QQHome.png', title: 'QQ空间', url: 'https://qzone.qq.com/' },
  { img: 'QQMusicButton.png', title: 'QQ音乐', url: 'https://y.qq.com/' },
  { img: 'QQTVButton.png', title: '网络电视(QQLive)', url: 'https://v.qq.com/' },
  { img: 'OpenPet.png', title: 'QQ宠物', url: 'https://pet.qq.com/' },
];

const STATUS_LABEL: Record<string, string> = {
  online: '在线',
  away: '离开',
  busy: '忙碌',
  invisible: '隐身',
  offline: '离线',
};

interface QQBuddyListProps {
  /** 打开与某好友的聊天窗口。 */
  onOpenChat: (buddyId: string) => void;
}

const QQBuddyList: React.FC<QQBuddyListProps> = ({ onOpenChat }) => {
  const state = useQQStore();
  const { me, groups, buddies, openGroups, unread } = state;

  const buddiesOf = (groupId: string): RuntimeBuddy[] =>
    buddies.filter(b => b.group === groupId);

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
          title="修改个人资料"
          style={{ backgroundImage: `url(${qqAvatar(me?.avatar ?? 50)})` }}
        />
        <button className="qq-status-btn" title="更改状态" />
        <label className="qq-num" data-testid="qq-me-nick">
          {me ? `${me.nickname}(${STATUS_LABEL[me.status] ?? '在线'})` : ''}
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
                          title="双击打开聊天窗口"
                        >
                          <img className="qq-friend-avatar" src={qqAvatar(buddy.avatar)} alt="" />
                          <div className="qq-friend-info">
                            <p className="qq-friend-name">{buddy.nickname}</p>
                            <p className="qq-friend-motto">{buddy.signature || ' '}</p>
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
              onClick={() => b.url && window.open(b.url, '_blank', 'noopener')}
            />
          ))}
        </div>
        <button className="qq-menu-button" title="菜单" />
        <div className="qq-toolbar-btns qq-toolbar-2">
          <button
            className="qq-msgmgr-button"
            title="信息管理器"
            style={{ backgroundImage: `url(${qqImg('MsgManagerButton.png')})` }}
          />
          <button className="qq-search-button" title="查找用户">
            查找
          </button>
        </div>
      </div>
    </PanelRoot>
  );
};

export default QQBuddyList;
