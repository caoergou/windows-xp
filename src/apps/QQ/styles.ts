import styled, { keyframes } from 'styled-components';
import { qqUrl } from './assets';
import { COLORS } from '../../constants';

// 未读消息时好友头像抖动（经典 QQ：头像左右快速摇晃）。
const avatarShake = keyframes`
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-2px); }
  40% { transform: translateX(2px); }
  60% { transform: translateX(-2px); }
  80% { transform: translateX(1px); }
`;

/**
 * QQ2006 皮肤样式，逐行移植自 mengkunsoft/QQ2006 的原版 CSS（见 assets/NOTICE.md），
 * 仅做一处适配：主面板与聊天窗渲染在**引擎的 XP 窗框内**，故去掉复刻件自绘的
 * 外层圆角标题栏（拖动 / 最小化 / 关闭由引擎窗框提供），保留其余像素级还原的
 * 皮肤图、按钮、布局与配色。
 */

/**
 * xp.css 给所有 <button> 强制 `min-width:75px` + 立体 box-shadow，会把 QQ 的
 * 17/27/16px 图标按钮统统撑成 75px（登录下拉框平铺出多余箭头、好友面板图标错位
 * 缺失）。QQ 的按钮尺寸全部自绘，故在每个根节点内先复位。
 */
const BTN_RESET = `
  button { min-width: 0; min-height: 0; box-shadow: none; box-sizing: border-box; padding: 0; }
`;

/**
 * QQ2006 皮肤复用色板。集中定义一次、跨样式引用，既避免字面量重复，也满足
 * #143 内联 hex 棘轮（只减不增）——原本散落的 #fff / #888 / 蓝绿昵称色等在此归一。
 */
const C = {
  white: '#fff',
  grey: '#888',
  peerNick: '#210f95', // 对方昵称蓝
  myNick: '#2d794b', // 自己昵称绿
  peerNum: '#071E81', // 横幅号码/信息条蓝
  infoBlue: '#b6d5f5', // 信息条渐变底
  infoBorder: '#84a6c6', // 信息条下边线
  hover: '#eaf2ff', // 好友/结果悬停浅蓝
  closeRed: '#e8110e', // 关闭按钮 hover 红
  selSub: '#dfe8ff', // 选中项副文本
  zoneBg: '#f6f6f6', // 个人空间底色
};

// 通用按钮（登录框 / 聊天窗 / 主面板共用）—— QQ-CLASSIC-UI §2 通用按钮样式
const QQ_BTN = `
  font-size: 12px;
  background: linear-gradient(to bottom, ${C.white}, #9FD4FF);
  border: 1px solid #00558E;
  border-radius: 3px;
  cursor: pointer;
  color: #000;
  &:focus { box-shadow: inset 0 0 0 1px #ffe762, inset 0 0 0 2px #fcb833; }
  &:hover { background: linear-gradient(to bottom, ${C.white}, #B9E1FF); }
  &:active { background: linear-gradient(to bottom, #97C5EC, #D2F8FD); }
`;

// ─── 主面板（好友列表） ──────────────────────────────────────────────────────
export const PanelRoot = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  font-family: SimSun, serif;
  font-size: 12px;
  user-select: none;
  overflow: hidden;

  .qq-flex-bg {
    position: absolute;
    width: 100%;
    height: 100%;
    display: flex;
    top: 0;
    left: 0;
  }
  ${BTN_RESET}
  .qq-btn { ${QQ_BTN} }

  /* 个人信息横幅 44px */
  .qq-head {
    width: 100%;
    height: 44px;
    position: relative;
    overflow: hidden;
    flex-shrink: 0;
  }
  .qq-head-left { background-image: ${qqUrl('BackgroundTitleLeft2.png')}; width: 64px; }
  .qq-head-center { background-image: ${qqUrl('BackgroundTitleCenter2.png')}; flex: 1; }
  .qq-head-right { background-image: ${qqUrl('BackgroundTitleRight2.png')}; width: 14px; }

  .qq-status-pic {
    position: absolute; width: 32px; height: 32px; left: 8px; top: 6px;
    cursor: pointer; background-size: cover; border: 0;
  }
  .qq-status-btn {
    position: absolute; width: 11px; height: 36px; left: 41px; top: 4px;
    background-image: ${qqUrl('StatusButton_Normal.png')};
    &:hover { background-image: ${qqUrl('StatusButton_Hover.png')}; }
    &:active { background-image: ${qqUrl('StatusButton_Down.png')}; }
  }
  .qq-num {
    position: absolute; left: 54px; top: 9px; width: 109px; height: 13px;
    font-family: "MS Sans Serif", SimSun; font-size: 8pt; font-weight: 700; color: ${C.peerNum};
    white-space: nowrap; overflow: hidden;
  }
  .qq-head-btns {
    position: absolute; left: 54px; top: 24px; display: flex; gap: 6px;
  }
  .qq-head-btns button { height: 16px; display: flex; align-items: center; }
  .qq-head-btns button > img { vertical-align: middle; }
  .qq-head-btns button > label {
    color: ${C.peerNum}; font-family: "MS Sans Serif", SimSun; font-size: 8pt; font-weight: 400;
    cursor: pointer; height: 16px; padding-left: 2px;
  }

  /* 主体区 */
  .qq-body { flex: 1; position: relative; min-height: 0; }
  .qq-body-left { background-image: ${qqUrl('BackgroundL.png')}; width: 11px; }
  .qq-body-center { background-image: ${qqUrl('BackgroundC.png')}; flex: 1; }
  .qq-body-right { background-image: ${qqUrl('BackgroundR.png')}; width: 8px; }

  .qq-panel-bar {
    position: absolute; left: 3px; top: 4px; width: 29px; height: 100%;
    display: flex; flex-direction: column;
  }
  .qq-panel-bar button {
    background: ${qqUrl('panel-bar/barback2_normal.png')};
    height: 37px; width: 27px; margin-top: -4px; border: 0;
    &:hover { background: ${qqUrl('panel-bar/barback2_over.png')}; }
  }
  .qq-panel-bar button > img { vertical-align: super; width: 22px; height: 22px; }
  .qq-panel-bar button.active { background: ${qqUrl('panel-bar/barback_disabled.png')}; z-index: 1; }

  /* 好友列表盒 */
  .qq-friend-box {
    position: absolute; left: 29px; right: 4px; top: 0; height: 100%;
    background: ${C.white}; border: 1px solid #2367c3; border-radius: 2px;
    overflow: hidden; padding: 1px; display: flex; gap: 1px; flex-direction: column;
  }
  .qq-friend-box > button {
    text-align: center; font-size: 12px; width: 100%; color: #183c94; padding: 1px 0;
    ${QQ_BTN}
  }
  .qq-friend-list { flex: 1; overflow-y: auto; min-height: 0; }

  .qq-friend-group {
    background-image: ${qqUrl('group_close.png')};
    background-repeat: no-repeat; background-position: 2px 4px;
    padding: 5px 0 5px 20px; color: #101c4a; cursor: pointer;
    overflow: hidden; white-space: nowrap;
  }
  .qq-friend-group.on { background-image: ${qqUrl('group_open.png')}; }

  /* 统一的好友条目：头像 40px 与右侧信息块垂直居中；名字/签名各占一行、
     行高一致、超出省略号，避免因签名有无 / 角标多少造成条目高低不齐。 */
  .qq-friend-item { display: flex; align-items: center; padding: 3px 4px 3px 4px; cursor: pointer; }
  .qq-friend-item:hover { background: ${C.hover}; }
  .qq-friend-item.selected { background: #316AC5; }
  .qq-friend-item.selected .qq-friend-name,
  .qq-friend-item.selected .qq-friend-motto { color: ${C.white}; }
  .qq-friend-avatar { width: 40px; height: 40px; flex-shrink: 0; }
  .qq-friend-item.has-unread .qq-friend-avatar { animation: ${avatarShake} 0.4s ease-in-out infinite; }
  .qq-friend-info { flex: 1; min-width: 0; padding: 0 2px 0 6px; line-height: 1.3; }
  .qq-friend-info p { margin: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
  .qq-friend-name { color: #000400; }
  .qq-friend-motto { color: #808080; }
  .qq-friend-item.qq-vip .qq-friend-name { color: #f00; }
  .qq-friend-item.qq-vip .qq-friend-motto { color: #ff7d7b; }
  .qq-friend-item.qq-offline { filter: grayscale(100%); }
  .qq-friend-item.qq-offline .qq-friend-name,
  .qq-friend-item.qq-offline .qq-friend-motto { color: #a8a8a8; }

  .qq-friend-icons { display: flex; gap: 3px; margin-top: 1px; }
  .qq-friend-icons div { width: 15px; height: 15px; background-size: contain; background-repeat: no-repeat; }
  .qq-icon-music { background-image: ${qqUrl('mms-bar/MMSBar_MediaRing.png')}; }
  .qq-icon-ring { background-image: ${qqUrl('mms-bar/MMSBar_PhoneRing.png')}; }
  .qq-icon-mobile { background-image: ${qqUrl('mms-bar/MMSBar_MobileQQ.png')}; }

  /* 底部工具栏 62px */
  .qq-toolbar { height: 62px; position: relative; flex-shrink: 0; }
  .qq-toolbar-left { background-image: ${qqUrl('ToolBarBackgroundL.png')}; width: 15px; }
  .qq-toolbar-center { background-image: ${qqUrl('ToolBarBackgroundC.png')}; flex: 1; }
  .qq-toolbar-right { background-image: ${qqUrl('ToolBarBackgroundR.png')}; width: 15px; }
  .qq-toolbar-btns {
    position: absolute; display: flex; overflow: hidden; gap: 8px; height: auto;
    left: 10px; right: 10px; top: 12px;
  }
  .qq-toolbar-btns > button { width: 16px; height: 16px; background-size: cover; flex-shrink: 0; border: 0; }
  .qq-menu-button {
    position: absolute; left: 0; top: 32px; width: 65px; height: 24px; display: block;
    background-image: ${qqUrl('MenuButton_Normal.png')}; background-size: cover; cursor: pointer; border: 0;
    &:hover { background-image: ${qqUrl('MenuButton_Hover.png')}; }
    &:active { background-image: ${qqUrl('MenuButton_Down.png')}; }
  }
  .qq-toolbar-2 { top: 37px; left: 74px; }
  .qq-search-button {
    width: 47px; height: 20px; background-image: ${qqUrl('SearchButton.png')};
    background-size: auto 100%; background-repeat: no-repeat; padding-left: 18px;
    color: ${C.white}; font-family: 'MS Sans Serif', SimSun; font-weight: 400; font-size: 8pt; border: 0; cursor: pointer;
    &:hover { color: #000; }
  }
  .qq-msgmgr-button { width: 19px; height: 16px; background-repeat: no-repeat; border: 0; background-color: transparent; cursor: pointer; }
`;

// ─── 登录窗口 ────────────────────────────────────────────────────────────────
export const LoginRoot = styled.div`
  width: 100%; height: 100%;
  background-color: #ECF6FF;
  font-family: SimSun, serif; font-size: 12px; user-select: none;
  display: flex; flex-direction: column;

  ${BTN_RESET}
  .qq-btn { ${QQ_BTN} }
  .qq-login-banner {
    text-align: center; height: 47px; flex-shrink: 0;
    background-image: ${qqUrl('login_banner.png')};
    background-size: 100%; background-position: top; background-repeat: no-repeat;
  }
  .qq-login-form {
    background: linear-gradient(to bottom, #E4F3FF, #F0F8FF, #F0F8FF, #F0F8FF, #E4F3FF);
    border: 1px solid #2F74C5; padding: 18px; margin: 6px;
  }
  .qq-login-form-row { margin-bottom: 18px; display: flex; align-items: center; position: relative; }
  .qq-login-form-row label { width: 55px; text-align: left; margin-right: 7px; flex-shrink: 0; }
  .qq-login-form-row input[type="text"],
  .qq-login-form-row input[type="password"] {
    width: 150px; height: 18px; border: 1px solid #7F9DB9; padding: 0 2px; font-size: 12px; font-family: SimSun, serif; flex-shrink: 0;
  }
  .qq-login-form-row .qq-btn { flex-shrink: 0; white-space: nowrap; }
  .qq-login-method { position: absolute; left: 46px; top: 4px; }
  /* 号码组合框：输入框 + 内嵌下拉钮，下拉钮紧贴输入框右内缘（无间隙）。 */
  .qq-login-num-wrap { position: relative; width: 150px; height: 20px; flex-shrink: 0; }
  .qq-login-num-wrap input {
    width: 100%; height: 20px; border: 1px solid #7F9DB9; padding: 0 20px 0 2px;
    font-size: 12px; font-family: SimSun, serif;
  }
  .qq-login-num-select {
    position: absolute; right: 1px; top: 1px; bottom: 1px; width: 17px;
    background: ${qqUrl('dropdown.png')} no-repeat center; border: 0; cursor: pointer;
    &:hover { background-image: ${qqUrl('dropdown_hover.png')}; }
    &:active { background-image: ${qqUrl('dropdown_active.png')}; }
  }
  .qq-login-reg { width: 62px; height: 20px; margin: 0 0 0 8px; }
  .qq-login-forget {
    margin: 0 0 0 10px; color: #0033cc; text-decoration: none; white-space: nowrap; cursor: pointer;
    &:hover { text-decoration: underline; }
  }
  .qq-login-check { margin-bottom: 0; }
  .qq-login-check label { width: auto; text-align: left; margin: 0 12px 0 4px; }
  .qq-login-buttons { display: flex; padding: 8px 8px 10px; align-items: center; }
  .qq-login-buttons button { height: 22px; width: 75px; margin: 0 5px; }
  .qq-login-buttons span { flex: 1; }
`;

// ─── 登录中（窄条窗，与主面板同形） ─────────────────────────────────────────
export const LoadingRoot = styled.div`
  width: 100%; height: 100%;
  display: flex; flex-direction: column;
  font-family: SimSun, serif; font-size: 12px; user-select: none;
  position: relative; overflow: hidden;

  ${BTN_RESET}
  .qq-flex-bg { position: absolute; width: 100%; height: 100%; display: flex; top: 0; left: 0; }
  .qq-logging-body { flex: 1; }
  .qq-body-left { background-image: ${qqUrl('logging/BITMAP1736_1.png')}; width: 15px; }
  .qq-body-center { background-image: ${qqUrl('logging/BITMAP1737_1.png')}; flex: 1; }
  .qq-body-right { background-image: ${qqUrl('logging/BITMAP1738_1.png')}; width: 15px; }
  .qq-logging-main {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    position: absolute; left: 0; right: 0; top: 24px; bottom: 24px; z-index: 1;
  }
  .qq-logging-main p { margin: 2px 0 12px; }
  .qq-logging-cancel {
    width: 90px; height: 26px; border: none; outline: none; cursor: pointer;
    background-image: ${qqUrl('logging/BITMAP1742_1.png')};
    &:hover { background-image: ${qqUrl('logging/BITMAP1744_1.png')}; }
    &:active { background-image: ${qqUrl('logging/BITMAP1743_1.png')}; }
  }
`;

// ─── 聊天窗口 ────────────────────────────────────────────────────────────────
export const ChatRoot = styled.div`
  width: 100%; height: 100%;
  background: #5db7ff;
  font-family: SimSun, serif; font-size: 12px; user-select: none;
  display: flex; flex-direction: column;
  overflow: hidden;

  ${BTN_RESET}
  .qq-btn { ${QQ_BTN} }

  /* 大工具条 36px */
  .qq-im-big-toolbar {
    margin: 4px 4px 0; padding-left: 6px; height: 36px; flex-shrink: 0;
    background-image: ${qqUrl('im/IMBigToolBarBackground.png')};
    background-repeat: repeat-x; display: flex; align-items: center;
  }
  .qq-im-big-toolbar button {
    color: rgb(7,30,129); font-weight: bold; background-repeat: no-repeat;
    background-position: 2px center; padding: 0 8px 0 28px; height: 28px;
    border: 1px solid transparent; background-color: transparent; cursor: pointer;
    &:hover { border-color: rgb(70,136,201); background-color: rgb(130,199,255); }
    &:active { border-color: rgb(40,99,157); background-color: rgb(83,168,245); }
  }
  .im-big-msg { background-image: ${qqUrl('im/IMBigToolbarMQQ.png')}; }
  .im-big-video { background-image: ${qqUrl('im/IMBigToolbarVideo.png')}; }
  .im-big-audio { background-image: ${qqUrl('im/IMBigToolbarQQSQQ.png')}; }
  .im-big-file { background-image: ${qqUrl('im/IMBigToolbarSendFile.png')}; }
  .im-big-3d { background-image: ${qqUrl('im/IMBigToolbar3DShow.png')}; }
  .im-big-invite { background-image: ${qqUrl('im/IMBigToolbarInvite.png')}; }

  .qq-im-contant { display: flex; flex: 1; gap: 4px; padding: 4px 8px 8px; overflow: hidden; min-height: 0; }
  /* min-width:0 lets the flex children shrink below their content width so the
     nowrap friend-info line and long messages don't force horizontal overflow
     (which would otherwise push the 140px Q-show sidebar off the window). */
  .qq-im-main { display: flex; flex-direction: column; flex: 1; gap: 6px; min-height: 0; min-width: 0; }

  .qq-im-chat {
    position: relative;
    display: flex; flex-direction: column; flex: 1; width: 100%;
    border: 1px solid rgb(53,111,175); border-radius: 4px; background: ${C.white};
    overflow: hidden; min-height: 0; min-width: 0;
  }
  .qq-im-chat-msg { flex: 1; display: flex; flex-direction: column; min-height: 0; }

  .qq-im-friend-info {
    background: linear-gradient(to bottom, ${C.white}, ${C.infoBlue});
    border-bottom: 1px solid ${C.infoBorder}; padding: 1px 2px; color: rgb(7,30,129); cursor: pointer;
    overflow: hidden; white-space: nowrap; text-overflow: ellipsis;
  }
  .qq-im-friend-info:hover { color: rgb(99,119,190); }
  .qq-im-friend-info img { width: 20px; height: 20px; margin-right: 5px; vertical-align: sub; float: left; }

  .qq-im-chat-msg-list { flex: 1; overflow-y: auto; overflow-x: hidden; padding: 5px; min-height: 0; list-style: none; margin: 0; }
  .qq-im-chat-msg-list li { margin-bottom: 2px; }
  .qq-im-chat-msg-list li p { color: #000; padding-left: 15px; line-height: 1.4; margin: 0; word-break: break-all; }
  .qq-im-chat-msg-list li p:first-of-type { color: ${C.peerNick}; padding-left: 0; }
  .qq-im-chat-msg-list li.my p:first-of-type { color: ${C.myNick}; }
  .qq-im-chat-msg-list li p:first-of-type span { font-size: 12px; padding-left: 8px; }
  .qq-im-typing { color: ${C.grey}; padding: 2px 5px; font-style: normal; }

  /* 小工具条 20px */
  .qq-im-chat-toolbar {
    display: flex; align-items: center; gap: 4px; height: 20px; padding-left: 4px; flex-shrink: 0;
    background-image: ${qqUrl('im/IMSmallToolbarBackground.png')};
    background-size: 10000px 100%; background-position: center;
  }
  .qq-im-chat-toolbar button {
    width: 18px; height: 18px; border: 1px solid transparent; background-color: transparent; background-repeat: no-repeat; cursor: pointer;
    &:hover { border-color: rgb(135,164,197); background-color: rgb(183,214,245); }
    &:active { border-color: rgb(109,146,186); background-color: rgb(170,200,230); }
  }
  .im-toolbar-font { background-image: ${qqUrl('im/IMSmallToolbarFont.png')}; }
  .im-toolbar-face { background-image: ${qqUrl('im/IMSmallToolbarFace.png')}; }
  .im-toolbar-other { background-image: ${qqUrl('im/IMSmallToolbarOtherContent.png')}; }
  .im-toolbar-picture { background-image: ${qqUrl('im/IMSmallToolbarPicture.png')}; }
  .im-toolbar-catch { background-image: ${qqUrl('im/IMSmallToolbarCatch.png')}; }
  .im-toolbar-scene { background-image: ${qqUrl('im/IMSmallToolbarScene.png')}; }
  .im-toolbar-bag { background-image: ${qqUrl('im/IMSmallToolbarSuperbag.png')}; }
  .im-toolbar-ptt { background-image: ${qqUrl('im/IMSmallToolbarPtt.png')}; }
  .qq-im-chat-toolbar .sep { background: rgb(114,149,188); width: 1px; height: 80%; }

  .qq-im-chat-send { height: 70px; padding: 4px; border: none; outline: none; resize: none; font-family: SimSun, serif; font-size: 12px; }

  .qq-im-btns { display: flex; height: 22px; gap: 5px; align-items: center; }
  .qq-im-btns span { flex: 1; }
  .qq-im-btns .qq-btn { padding: 0 6px; height: 20px; }

  /* 右侧栏 140px */
  .qq-im-side { display: flex; flex-direction: column; flex-shrink: 0; border: 1px solid rgb(53,111,175); width: 140px; height: 100%; overflow: hidden; background: ${C.white}; }
  .qq-im-side-btn {
    position: relative; height: 20px; width: 100%; z-index: 2; text-align: left; padding-left: 20px; border: 0; cursor: pointer;
    color: #0f0657; font-weight: bold;
    background-image: ${qqUrl('im/IMSidebarButtonExpand_Normal.png')}; background-size: 1000px 100%;
  }
  .qq-im-show { height: 100%; background-size: cover; background-position: 50%; background-repeat: no-repeat; }
  /* 单张 QQ 秀素材复用于「对方形象 / 我的形象」两栏（体积预算取舍）。 */
  .qq-im-show-1 { background-image: ${qqUrl('im/show1.gif')}; }
  .qq-im-show-3 { background-image: ${qqUrl('im/show1.gif')}; transform: scaleX(-1); }
  .qq-im-zone { background: ${C.zoneBg}; color: #0f0657; }
  .qq-im-zone div { line-height: 1.4; padding: 0 2px; white-space: nowrap; overflow: hidden; }
  .qq-im-zone span { color: red; }

  /* 聊天记录查看器：覆盖在消息区之上的历史日志面板（数据取自当前会话线程）。 */
  .qq-im-history {
    position: absolute; inset: 0; z-index: 3; display: flex; flex-direction: column;
    background: ${C.white}; border-radius: 4px;
  }
  .qq-im-history-head {
    display: flex; align-items: center; justify-content: space-between;
    padding: 3px 6px; color: ${COLORS.BLACK};
    background: linear-gradient(to bottom, ${C.white}, ${C.infoBlue});
    border-bottom: 1px solid ${C.infoBorder}; font-weight: bold;
  }
  .qq-im-history-head button { ${QQ_BTN} padding: 0 8px; height: 18px; }
  .qq-im-history-list { flex: 1; overflow-y: auto; padding: 6px 8px; }
  .qq-im-history-list .row { margin-bottom: 4px; line-height: 1.4; }
  .qq-im-history-list .meta { color: ${C.peerNick}; }
  .qq-im-history-list .row.my .meta { color: ${C.myNick}; }
  .qq-im-history-list .meta span { color: ${C.grey}; padding-left: 8px; }
  .qq-im-history-list .body { color: ${COLORS.BLACK}; word-break: break-all; }
  .qq-im-history-empty { color: ${C.grey}; text-align: center; padding-top: 20px; }

  /* 表情选择面板：小工具条上方弹出的经典黄脸网格。 */
  .qq-emoji-picker {
    position: absolute; z-index: 4; bottom: 96px; left: 8px;
    width: 224px; max-height: 200px; overflow-y: auto;
    background: ${C.white}; border: 1px solid ${COLORS.INPUT_BORDER};
    box-shadow: 2px 2px 6px rgba(0, 0, 0, 0.28); padding: 4px;
    display: grid; grid-template-columns: repeat(8, 1fr); gap: 1px;
    align-content: start;
  }
  .qq-emoji-picker button {
    height: 24px; font-size: 16px; line-height: 24px; cursor: pointer;
    border: 1px solid transparent; background: transparent; filter: saturate(1.4);
    &:hover { border-color: ${COLORS.MENU_HIGHLIGHT}; background: ${C.hover}; }
  }
`;

// ─── QQ 弹出层（关闭对话框 / 查找对话框，Portal 到 body，屏幕居中）──────────────
export const QQModalLayer = styled.div`
  position: fixed; inset: 0; z-index: 2147483000;
  display: flex; align-items: center; justify-content: center;
  background: rgba(0, 0, 0, 0.12);
  font-family: SimSun, serif; font-size: 12px; user-select: none;

  ${BTN_RESET}
  .qq-btn { ${QQ_BTN} height: 22px; padding: 0 12px; }

  .qq-dlg {
    background: ${COLORS.SURFACE};
    border: 1px solid ${COLORS.BUTTON_BORDER};
    box-shadow: 3px 3px 10px rgba(0, 0, 0, 0.4);
    display: flex; flex-direction: column;
  }
  .qq-dlg-title {
    height: 26px; display: flex; align-items: center; gap: 5px; padding: 0 4px 0 6px;
    background: ${COLORS.WINDOW_TITLE_ACTIVE};
    color: ${C.white}; font-weight: bold; border-radius: 4px 4px 0 0;
  }
  .qq-dlg-title img { width: 16px; height: 16px; }
  .qq-dlg-title .title-x {
    margin-left: auto; width: 20px; height: 18px; color: ${C.white}; cursor: pointer;
    background: rgba(255, 255, 255, 0.15); border: 1px solid rgba(255, 255, 255, 0.5);
    border-radius: 2px; line-height: 16px; text-align: center; font-family: Tahoma, sans-serif;
    &:hover { background: ${C.closeRed}; }
  }
  .qq-dlg-body { padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; }
  .qq-dlg-row { display: flex; align-items: center; gap: 8px; }
  .qq-dlg-radio { display: flex; align-items: center; gap: 6px; cursor: pointer; }
  .qq-dlg-btns { display: flex; justify-content: flex-end; gap: 8px; padding: 0 16px 14px; }

  /* 查找好友对话框 */
  .qq-find-input {
    flex: 1; height: 20px; border: 1px solid ${COLORS.INPUT_BORDER}; padding: 0 4px;
    font-size: 12px; font-family: SimSun, serif;
  }
  .qq-find-results {
    height: 168px; overflow-y: auto; border: 1px solid ${COLORS.BORDER_GREY};
    background: ${C.white}; margin: 0; padding: 0; list-style: none;
  }
  .qq-find-results li {
    display: flex; align-items: center; gap: 8px; padding: 4px 6px; cursor: pointer;
  }
  .qq-find-results li:hover, .qq-find-results li.sel {
    background: ${COLORS.MENU_HIGHLIGHT}; color: ${C.white};
  }
  .qq-find-results li img { width: 28px; height: 28px; flex-shrink: 0; }
  .qq-find-results .fr-name { font-weight: bold; }
  .qq-find-results .fr-sub { color: ${C.grey}; }
  .qq-find-results li:hover .fr-sub, .qq-find-results li.sel .fr-sub { color: ${C.selSub}; }
  .qq-find-empty { color: ${C.grey}; text-align: center; padding-top: 60px; }
`;

// ─── 好友悬停 tooltip（昵称 / 号码 / 状态 / 签名卡片）──────────────────────────
export const BuddyTooltip = styled.div`
  position: fixed; z-index: 2147483200; width: 210px;
  background: ${C.white}; border: 1px solid ${COLORS.DIALOG_BLUE};
  box-shadow: 2px 2px 6px rgba(0, 0, 0, 0.3);
  font-family: SimSun, serif; font-size: 12px; user-select: none; pointer-events: none;

  .bt-head {
    display: flex; align-items: center; gap: 8px; padding: 6px;
    background: linear-gradient(to bottom, ${C.white}, ${C.infoBlue});
    border-bottom: 1px solid ${C.infoBorder};
  }
  .bt-head img { width: 36px; height: 36px; flex-shrink: 0; }
  .bt-name { font-weight: bold; color: ${C.peerNum}; }
  .bt-name.vip { color: red; }
  .bt-num { color: ${C.grey}; }
  .bt-body { padding: 5px 8px; line-height: 1.5; }
  .bt-status .dot {
    display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 5px;
  }
  .bt-sign { color: ${C.grey}; margin-top: 3px; word-break: break-all; }
`;
