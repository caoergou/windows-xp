import styled, { keyframes } from 'styled-components';
import { xpScrollbarStyles, xpButtonStyles, xpTitleBarStyles } from '../../theme';
import { resolveOSTheme } from '../../themes/useOSTheme';

export const Container = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  font-family: ${({ theme }) => resolveOSTheme(theme).fonts.UI};
`;

export const MainArea = styled.div`
  flex: 1;
  display: flex;
  overflow: hidden;
  position: relative;
`;

export const Sidebar = styled.div`
  width: 250px;
  background: ${({ theme }) => resolveOSTheme(theme).tokens.WHITE};
  border-right: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.GREY_99};
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
`;

export const SidebarHeader = styled.div`
  background: ${({ theme }) => resolveOSTheme(theme).tokens.HEADER_GRADIENT_BLUE};
  color: white;
  padding: 5px;
  font-weight: bold;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
`;

export const HistoryList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0;
  background: white;
  ${xpScrollbarStyles}
`;

export const HistoryItem = styled.div`
  padding: 5px;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  border-bottom: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.GREY_EE};
  font-size: 12px;
  display: flex;
  flex-direction: column;

  &:hover {
    background: ${({ theme }) => resolveOSTheme(theme).tokens.GREY_F0};
  }

  .url {
    color: ${({ theme }) => resolveOSTheme(theme).tokens.LINK_BLUE};
  }

  .time {
    color: ${({ theme }) => resolveOSTheme(theme).tokens.GREY_88};
    font-size: 10px;
    margin-top: 2px;
  }
`;

export const FavoritesItem = styled.div`
  padding: 5px;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  border-bottom: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.GREY_EE};
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 5px;

  &:hover {
    background: ${({ theme }) => resolveOSTheme(theme).tokens.GREY_F0};
  }

  .name {
    color: ${({ theme }) => resolveOSTheme(theme).tokens.LINK_BLUE};
    flex: 1;
  }

  .delete {
    color: ${({ theme }) => resolveOSTheme(theme).tokens.ERROR_RED};
    font-size: 10px;
    opacity: 0;
    cursor: pointer;
    padding: 2px 4px;
    border-radius: 2px;

    &:hover {
      opacity: 1;
      background: ${({ theme }) => resolveOSTheme(theme).tokens.ERROR_TINT};
    }
  }

  &:hover .delete {
    opacity: 1;
  }
`;

export const FavoritesToolbar = styled.div`
  padding: 5px;
  background: ${({ theme }) => resolveOSTheme(theme).tokens.GREY_F0};
  border-bottom: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.GREY_DD};
  display: flex;
  gap: 3px;
`;

export const ToolbarButton = styled.button`
  padding: 3px 8px;
  ${xpButtonStyles}
`;

export const Content = styled.div`
  flex: 1;
  background: white;
  position: relative;
  overflow: hidden;

  iframe {
    width: 100%;
    height: 100%;
    border: none;
  }
`;

export const Footer = styled.footer`
  height: 22px;
  border-top: 1px solid rgba(0, 0, 0, 0.2);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
  background-color: rgb(236, 233, 216);
  display: flex;
  align-items: center;
  flex-shrink: 0;
  overflow: hidden;
  position: relative;
`;

const ieLoadingBar = keyframes`
  0%   { left: 0;   width: 0%; opacity: 1; }
  30%  { left: 0;   width: 60%; }
  60%  { left: 25%; width: 70%; }
  90%  { left: 60%; width: 40%; opacity: 1; }
  100% { left: 100%; width: 0%; opacity: 0; }
`;

export const LoadingBar = styled.div<{ $visible: boolean }>`
  position: absolute;
  bottom: 0;
  left: 0;
  height: 2px;
  background: ${({ theme }) => resolveOSTheme(theme).tokens.MENU_HIGHLIGHT};
  display: ${p => (p.$visible ? 'block' : 'none')};
  animation: ${ieLoadingBar} 1.5s ease-in-out infinite;
`;

export const FooterStatus = styled.div`
  flex: 1;
  height: 100%;
  display: flex;
  align-items: center;
  padding: 0 4px;
  font-size: 11px;
  font-family: ${({ theme }) => resolveOSTheme(theme).fonts.UI};
  gap: 4px;
  overflow: hidden;
  border-right: 1px solid rgba(0, 0, 0, 0.12);
  box-shadow: inset -1px 0 rgba(255, 255, 255, 0.5);
`;

export const StatusIcon = styled.img<{ $spinning?: boolean }>`
  height: 14px;
  width: 14px;
  flex-shrink: 0;
  animation: ${p => (p.$spinning ? 'ieSpin 0.8s linear infinite' : 'none')};

  @keyframes ieSpin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

export const StatusText = styled.span`
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: ${({ theme }) => resolveOSTheme(theme).tokens.GREY_33};
`;

export const FooterBlock = styled.div`
  height: 85%;
  width: 22px;
  border-left: 1px solid rgba(0, 0, 0, 0.15);
  box-shadow: inset 1px 0 rgba(255, 255, 255, 0.7);
  flex-shrink: 0;
`;

export const FooterRight = styled.div`
  display: flex;
  align-items: center;
  width: 150px;
  height: 100%;
  border-left: 1px solid rgba(0, 0, 0, 0.11);
  box-shadow: inset 1px 0 rgba(255, 255, 255, 0.7);
  padding-left: 5px;
  position: relative;
  font-size: 11px;
  font-family: ${({ theme }) => resolveOSTheme(theme).fonts.UI};
  gap: 4px;
  flex-shrink: 0;

  img {
    height: 14px;
    width: 14px;
  }
`;

export const FooterDots = styled.div`
  position: absolute;
  right: 11px;
  bottom: -1px;
  width: 2px;
  height: 2px;
  box-shadow:
    2px 0px rgba(0, 0, 0, 0.25),
    5.5px 0px rgba(0, 0, 0, 0.25),
    9px 0px rgba(0, 0, 0, 0.25),
    5.5px -3.5px rgba(0, 0, 0, 0.25),
    9px -3.5px rgba(0, 0, 0, 0.25),
    9px -7px rgba(0, 0, 0, 0.25),
    3px 1px rgba(255, 255, 255, 1),
    6.5px 1px rgba(255, 255, 255, 1),
    10px 1px rgba(255, 255, 255, 1),
    10px -2.5px rgba(255, 255, 255, 1),
    10px -6px rgba(255, 255, 255, 1);
`;

export const AddFavoriteModal = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: ${({ theme }) => resolveOSTheme(theme).tokens.SURFACE};
  border: 2px solid ${({ theme }) => resolveOSTheme(theme).tokens.MENU_HIGHLIGHT};
  border-radius: 0;
  box-shadow: 2px 2px 0 ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_SHADOW};
  z-index: 1000;
  min-width: 300px;
  overflow: hidden;
`;

export const ModalHeader = styled.div`
  ${xpTitleBarStyles}
  padding: 4px 8px;
  font-size: 12px;
  font-weight: bold;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: ${({ theme }) => resolveOSTheme(theme).fonts.UI};
`;

export const ModalTitle = styled.span`
  color: ${({ theme }) => resolveOSTheme(theme).tokens.WHITE};
`;

export const ModalBody = styled.div`
  padding: 12px 16px;
`;

export const ModalInput = styled.input`
  width: 100%;
  padding: 3px 4px;
  border: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.FIELD_BORDER};
  font-size: 12px;
  font-family: ${({ theme }) => resolveOSTheme(theme).fonts.UI};
  box-sizing: border-box;
`;

export const ModalButtons = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding: 0 16px 16px;
`;

export const ModalButton = styled.button`
  padding: 3px 12px;
  ${xpButtonStyles}
`;
