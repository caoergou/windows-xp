import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useUserProgress } from '../context/UserProgressContext';
import { getPuzzleIdFromAlbum, getPuzzleIdFromBlog, isAuxiliaryPuzzle } from '../utils/puzzleMapping';
import puzzleHints from '../data/puzzle_hints.json';
import qzoneUserMap from '../data/qzone/userMap.json';

const blogContentModules = import.meta.glob('../data/qzone/**/blogs/*.txt', { query: '?raw' });

/* ========== QQ空间 2014-2015 风格 ========== */

// 角色个性化主题
// 夏灯: 温暖橙黄 - 阳光开朗，"灯火"
// 林晓宇: 冷灰蓝黑白 - 摄影、敏感、孤独
// 陈默: 深绿暗色 - 技术宅、沉默、内敛
// 默认: 经典蓝色QQ空间
const THEMES = {
  xiadeng: {
    banner: 'linear-gradient(135deg, #B85C1A 0%, #E8943B 40%, #F0B86A 70%, #F5D89A 100%)',
    nav: 'linear-gradient(to bottom, #D4882E 0%, #C07A28 100%)',
    navBorderTop: '#E8A84A',
    navBorderBottom: '#8E5A1A',
    navActive: '#FFD700',
    accent: '#C07A28',
    accentDark: '#8E5A1A',
    accentLight: '#FDF2E0',
    accentMid: '#F0DCC0',
    sideHeader: 'linear-gradient(to bottom, #FDF2E0 0%, #F0DCC0 100%)',
    sideBorder: '#E0C8A0',
    linkColor: '#B85C1A',
    bg: '#F5EDE0',
    detailBg: '#F5EDE0',
  },
  linxiaoyu: {
    banner: 'linear-gradient(135deg, #1A1A2E 0%, #3D3D5C 40%, #5C5C7A 70%, #8888A0 100%)',
    nav: 'linear-gradient(to bottom, #4A4A6A 0%, #3A3A5A 100%)',
    navBorderTop: '#6A6A8A',
    navBorderBottom: '#2A2A4A',
    navActive: '#AAAACC',
    accent: '#4A4A6A',
    accentDark: '#2A2A4A',
    accentLight: '#EDEDF2',
    accentMid: '#D8D8E2',
    sideHeader: 'linear-gradient(to bottom, #EDEDF2 0%, #D8D8E2 100%)',
    sideBorder: '#C0C0D0',
    linkColor: '#3D3D5C',
    bg: '#E0E0E8',
    detailBg: '#E0E0E8',
  },
  chenmo: {
    banner: 'linear-gradient(135deg, #1A3A2A 0%, #2D6B4A 40%, #4A9A6A 70%, #7ABF8A 100%)',
    nav: 'linear-gradient(to bottom, #3A7A5A 0%, #2D6B4A 100%)',
    navBorderTop: '#5A9A7A',
    navBorderBottom: '#1A4A2A',
    navActive: '#90D0A0',
    accent: '#2D6B4A',
    accentDark: '#1A4A2A',
    accentLight: '#E8F2EC',
    accentMid: '#D0E4D8',
    sideHeader: 'linear-gradient(to bottom, #E8F2EC 0%, #D0E4D8 100%)',
    sideBorder: '#B0C8B8',
    linkColor: '#2D6B4A',
    bg: '#DCE8E0',
    detailBg: '#DCE8E0',
  },
  default: {
    banner: 'linear-gradient(135deg, #1B3A6B 0%, #3B7DD8 40%, #5CA0E8 70%, #8EC5F0 100%)',
    nav: 'linear-gradient(to bottom, #4A8BC9 0%, #3A7ABB 100%)',
    navBorderTop: '#6BA3D6',
    navBorderBottom: '#2B5F8E',
    navActive: '#FFD700',
    accent: '#4A8BC9',
    accentDark: '#2B5F8E',
    accentLight: '#EBF2FA',
    accentMid: '#D9E6F2',
    sideHeader: 'linear-gradient(to bottom, #EBF2FA 0%, #D9E6F2 100%)',
    sideBorder: '#C4D5E7',
    linkColor: '#2B5F8E',
    bg: '#D6E4F0',
    detailBg: '#D6E4F0',
  }
};

// 用户名 -> QQ号 的反向映射（用于点击跳转）
const NAME_TO_QQ = Object.fromEntries(
  Object.entries(qzoneUserMap).map(([qqId, dir]) => {
    const nameMap = { xiadeng: '夏灯', linxiaoyu: '林晓宇', chenmo: '陈默' };
    return [nameMap[dir], qqId];
  })
);

const getTheme = (userId) => {
  return THEMES[qzoneUserMap[userId]] || THEMES.default;
};

const Container = styled.div`
  width: 100%;
  height: 100%;
  background: ${props => props.$theme?.bg || '#D6E4F0'};
  font-family: "Microsoft YaHei", "SimSun", Arial, sans-serif;
  overflow-y: auto;
  overflow-x: hidden;
  color: #333;
  position: relative;
  box-sizing: border-box;
  font-size: 13px;
`;

const Banner = styled.div`
  height: 200px;
  background: ${props => props.$theme?.banner || 'linear-gradient(135deg, #1B3A6B 0%, #3B7DD8 40%, #5CA0E8 70%, #8EC5F0 100%)'};
  position: relative;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 60px;
    background: linear-gradient(to top, rgba(0,0,0,0.25), transparent);
  }
`;

const BannerContent = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 0 30px 15px;
  display: flex;
  align-items: flex-end;
  gap: 18px;
  z-index: 2;

  .avatar {
    width: 90px;
    height: 90px;
    border-radius: 4px;
    border: 3px solid rgba(255,255,255,0.9);
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    object-fit: cover;
    flex-shrink: 0;
  }

  .info {
    flex: 1;
    color: white;
    text-shadow: 0 1px 3px rgba(0,0,0,0.5);
    padding-bottom: 4px;

    h1 {
      margin: 0 0 4px 0;
      font-size: 22px;
      font-weight: bold;
    }

    p {
      margin: 0;
      font-size: 12px;
      opacity: 0.9;
    }
  }
`;

const NavBar = styled.div`
  background: ${props => props.$theme?.nav || 'linear-gradient(to bottom, #4A8BC9 0%, #3A7ABB 100%)'};
  border-top: 1px solid ${props => props.$theme?.navBorderTop || '#6BA3D6'};
  border-bottom: 2px solid ${props => props.$theme?.navBorderBottom || '#2B5F8E'};
  display: flex;
  padding: 0 30px;
  gap: 0;
`;

const NavItem = styled.div`
  padding: 9px 20px;
  color: ${props => props.$active ? '#fff' : 'rgba(255,255,255,0.85)'};
  font-size: 13px;
  cursor: pointer;
  position: relative;
  font-weight: ${props => props.$active ? 'bold' : 'normal'};
  background: ${props => props.$active ? 'rgba(255,255,255,0.15)' : 'transparent'};
  border-left: 1px solid rgba(255,255,255,0.1);

  &:first-child {
    border-left: none;
  }

  &:hover {
    background: rgba(255,255,255,0.1);
    color: #fff;
  }

  ${props => props.$active && `
    &::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 0;
      right: 0;
      height: 2px;
      background: ${props.$navActive || '#FFD700'};
    }
  `}
`;

const MainLayout = styled.div`
  max-width: 960px;
  margin: 15px auto;
  padding: 0 15px;
  display: flex;
  gap: 15px;
`;

const Sidebar = styled.div`
  width: 200px;
  flex-shrink: 0;
`;

const SideCard = styled.div`
  background: white;
  border: 1px solid ${props => props.$theme?.sideBorder || '#C4D5E7'};
  margin-bottom: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);

  .card-title {
    background: ${props => props.$theme?.sideHeader || 'linear-gradient(to bottom, #EBF2FA 0%, #D9E6F2 100%)'};
    border-bottom: 1px solid ${props => props.$theme?.sideBorder || '#C4D5E7'};
    padding: 8px 12px;
    font-size: 12px;
    font-weight: bold;
    color: ${props => props.$theme?.accentDark || '#2B5F8E'};
  }

  .card-body {
    padding: 10px 12px;
  }
`;

const SideNavItem = styled.div`
  padding: 7px 10px;
  font-size: 12px;
  color: ${props => props.$active ? '#fff' : (props.$theme?.linkColor || '#2B5F8E')};
  background: ${props => props.$active ? (props.$theme?.accent || '#4A8BC9') : 'transparent'};
  cursor: pointer;
  border-bottom: 1px solid #F0F0F0;

  &:last-child { border-bottom: none; }
  &:hover {
    background: ${props => props.$active ? (props.$theme?.accent || '#4A8BC9') : (props.$theme?.accentLight || '#EBF2FA')};
  }
`;

const ContentArea = styled.div`
  flex: 1;
  min-width: 0;
`;

const ContentCard = styled.div`
  background: white;
  border: 1px solid ${props => props.$theme?.sideBorder || '#C4D5E7'};
  margin-bottom: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
`;

const ContentCardHeader = styled.div`
  background: ${props => props.$theme?.sideHeader || 'linear-gradient(to bottom, #EBF2FA 0%, #D9E6F2 100%)'};
  border-bottom: 1px solid ${props => props.$theme?.sideBorder || '#C4D5E7'};
  padding: 8px 15px;
  display: flex;
  align-items: center;
  justify-content: space-between;

  h3 {
    margin: 0;
    font-size: 13px;
    font-weight: bold;
    color: ${props => props.$theme?.accentDark || '#2B5F8E'};
  }

  .count {
    font-size: 11px;
    color: #999;
  }
`;

const ContentCardBody = styled.div`
  padding: 0;
`;

const ShuoshuoItem = styled.div`
  padding: 14px 15px;
  border-bottom: 1px solid #EEF2F7;

  &:last-child { border-bottom: none; }

  .ss-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;

    .ss-avatar {
      width: 35px;
      height: 35px;
      border-radius: 3px;
      object-fit: cover;
      border: 1px solid #ddd;
    }

    .ss-name {
      font-weight: bold;
      color: ${props => props.$theme?.linkColor || '#2B5F8E'};
      font-size: 13px;
      cursor: pointer;
      &:hover { text-decoration: underline; }
    }

    .ss-time {
      font-size: 11px;
      color: #999;
      margin-left: auto;
    }
  }

  .ss-content {
    font-size: 13px;
    line-height: 1.6;
    color: #333;
    margin-left: 45px;
  }

  .ss-actions {
    margin-left: 45px;
    margin-top: 8px;
    display: flex;
    gap: 15px;
    font-size: 11px;
    color: #999;
    border-top: 1px dashed #EEF2F7;
    padding-top: 6px;
  }

  .ss-comments {
    margin-left: 45px;
    margin-top: 8px;
    background: #F5F7FA;
    border: 1px solid #E8ECF0;
    padding: 8px 10px;

    .comment-item {
      padding: 4px 0;
      font-size: 12px;
      line-height: 1.5;
      border-bottom: 1px dotted #E0E0E0;
      &:last-child { border-bottom: none; }

      .c-name {
        color: ${props => props.$theme?.linkColor || '#2B5F8E'};
        font-weight: bold;
        cursor: pointer;
        &:hover { text-decoration: underline; }
      }

      .c-reply { color: ${props => props.$theme?.linkColor || '#2B5F8E'}; }
    }
  }
`;

const BlogItem = styled.div`
  padding: 12px 15px;
  border-bottom: 1px solid #EEF2F7;
  cursor: pointer;
  display: flex;
  align-items: flex-start;
  gap: 12px;

  &:last-child { border-bottom: none; }
  &:hover { background: #F8FAFD; }

  .blog-icon {
    width: 28px;
    height: 28px;
    background: ${props => props.$theme?.nav || 'linear-gradient(135deg, #5CA0E8, #3B7DD8)'};
    border-radius: 3px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 14px;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .blog-info {
    flex: 1;
    min-width: 0;

    h4 {
      margin: 0 0 4px 0;
      font-size: 14px;
      color: ${props => props.$theme?.linkColor || '#2B5F8E'};
      font-weight: bold;
      display: flex;
      align-items: center;
      gap: 6px;

      .lock-icon {
        display: inline-block;
        width: 14px;
        height: 14px;
        background: #C9A000;
        border-radius: 2px;
        position: relative;
        &::after {
          content: '';
          position: absolute;
          top: 2px;
          left: 3px;
          width: 8px;
          height: 5px;
          border: 2px solid white;
          border-bottom: none;
          border-radius: 4px 4px 0 0;
        }
      }
    }

    .blog-summary {
      font-size: 12px;
      color: #666;
      line-height: 1.4;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .blog-meta {
      font-size: 11px;
      color: #999;
      margin-top: 4px;
    }
  }
`;

const AlbumGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 15px;
`;

const AlbumCard = styled.div`
  cursor: pointer;
  border: 1px solid #E0E0E0;
  background: white;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 2px 8px rgba(0,0,0,0.12);
  }

  .cover {
    width: 100%;
    padding-top: 100%;
    position: relative;
    background: #F0F0F0;
    overflow: hidden;

    img {
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
      object-fit: cover;
    }

    .placeholder {
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #999;
      font-size: 11px;
    }

    .locked-overlay {
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
      background: rgba(0,0,0,0.55);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 12px;
      font-weight: bold;
      gap: 4px;
    }
  }

  .album-name {
    padding: 8px;
    text-align: center;
    font-size: 12px;
    color: #333;
    border-top: 1px solid #E8E8E8;
    background: #FAFAFA;
  }
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
  padding: 12px 15px;
  border-top: 1px solid #EEF2F7;

  .page-btn {
    padding: 4px 10px;
    border: 1px solid ${props => props.$theme?.sideBorder || '#C4D5E7'};
    background: linear-gradient(to bottom, #FFFFFF 0%, #F0F4F8 100%);
    color: ${props => props.$theme?.accentDark || '#2B5F8E'};
    cursor: pointer;
    font-size: 12px;
    font-family: inherit;

    &:hover {
      background: ${props => props.$theme?.sideHeader || 'linear-gradient(to bottom, #EBF2FA 0%, #D9E6F2 100%)'};
      border-color: ${props => props.$theme?.accent || '#4A8BC9'};
    }

    &.active {
      background: ${props => props.$theme?.nav || 'linear-gradient(to bottom, #4A8BC9 0%, #3A7ABB 100%)'};
      color: white;
      border-color: ${props => props.$theme?.accentDark || '#2B5F8E'};
      font-weight: bold;
    }

    &:disabled {
      background: #F5F5F5;
      color: #BBB;
      cursor: default;
      border-color: #DDD;
    }
  }
`;

const DetailView = styled.div`
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: ${props => props.$theme?.detailBg || '#D6E4F0'};
  z-index: 50;
  overflow-y: auto;
  box-sizing: border-box;
`;

const DetailHeader = styled.div`
  background: ${props => props.$theme?.nav || 'linear-gradient(to bottom, #4A8BC9 0%, #3A7ABB 100%)'};
  border-bottom: 2px solid ${props => props.$theme?.navBorderBottom || '#2B5F8E'};
  padding: 10px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: white;

  .back-btn {
    padding: 4px 12px;
    background: rgba(255,255,255,0.15);
    border: 1px solid rgba(255,255,255,0.3);
    color: white;
    cursor: pointer;
    font-size: 12px;
    font-family: inherit;
    &:hover { background: rgba(255,255,255,0.25); }
  }

  h2 {
    margin: 0;
    font-size: 15px;
    font-weight: bold;
  }
`;

const DetailBody = styled.div`
  max-width: 760px;
  margin: 15px auto;
  padding: 0 15px;
`;

const BlogDetailCard = styled.div`
  background: white;
  border: 1px solid #C4D5E7;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);

  .blog-detail-header {
    background: linear-gradient(to bottom, #EBF2FA 0%, #D9E6F2 100%);
    border-bottom: 1px solid #C4D5E7;
    padding: 15px 20px;

    h2 {
      margin: 0 0 6px 0;
      font-size: 18px;
      color: #1B3A6B;
      font-weight: bold;
    }

    .meta {
      font-size: 11px;
      color: #888;
    }
  }

  .blog-detail-content {
    padding: 20px;
    line-height: 1.8;
    font-size: 14px;
    white-space: pre-wrap;
    color: #333;
  }
`;

const PhotoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
  padding: 15px 20px;

  img {
    width: 100%;
    height: 140px;
    object-fit: cover;
    border: 1px solid #ddd;
    cursor: pointer;
    transition: opacity 0.2s;
    &:hover { opacity: 0.85; }
  }
`;

const NotOpenedContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
  font-size: 14px;
  padding: 40px;
  text-align: center;

  h2 {
    color: #2B5F8E;
    margin-bottom: 8px;
    font-size: 16px;
  }
`;

const ProfileTable = styled.div`
  padding: 15px;

  .profile-row {
    display: flex;
    padding: 8px 0;
    border-bottom: 1px dashed #EEF2F7;
    font-size: 13px;
    &:last-child { border-bottom: none; }

    .label {
      width: 80px;
      color: #888;
      flex-shrink: 0;
    }
    .value {
      color: #333;
      flex: 1;
    }
  }
`;

/* ========== QQ空间密码对话框 ========== */

const QZonePasswordOverlay = styled.div`
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.4);
  z-index: 60;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const QZonePasswordDialog = styled.div`
  width: 380px;
  background: white;
  border: 1px solid ${props => props.$theme?.sideBorder || '#C4D5E7'};
  box-shadow: 0 4px 20px rgba(0,0,0,0.25);
  font-family: "Microsoft YaHei", "SimSun", Arial, sans-serif;

  .qpd-header {
    background: ${props => props.$theme?.nav || 'linear-gradient(to bottom, #4A8BC9 0%, #3A7ABB 100%)'};
    padding: 12px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: white;

    .qpd-title {
      font-size: 14px;
      font-weight: bold;
    }

    .qpd-close {
      width: 20px; height: 20px;
      background: rgba(255,255,255,0.2);
      border: 1px solid rgba(255,255,255,0.3);
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      line-height: 1;
      &:hover { background: rgba(255,255,255,0.35); }
    }
  }

  .qpd-body {
    padding: 20px;

    .qpd-icon-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;

      .qpd-lock-icon {
        width: 40px; height: 40px;
        background: ${props => props.$theme?.sideHeader || 'linear-gradient(to bottom, #EBF2FA 0%, #D9E6F2 100%)'};
        border: 1px solid ${props => props.$theme?.sideBorder || '#C4D5E7'};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        flex-shrink: 0;
      }

      .qpd-message {
        font-size: 13px;
        color: #333;
        line-height: 1.5;
      }
    }

    .qpd-input-group {
      margin-bottom: 12px;

      label {
        display: block;
        font-size: 12px;
        color: #666;
        margin-bottom: 4px;
      }

      input {
        width: 100%;
        height: 30px;
        padding: 0 8px;
        border: 1px solid ${props => props.$theme?.sideBorder || '#C4D5E7'};
        font-size: 13px;
        font-family: inherit;
        box-sizing: border-box;
        outline: none;

        &:focus {
          border-color: ${props => props.$theme?.accent || '#4A8BC9'};
          box-shadow: 0 0 0 2px ${props => props.$theme?.accentLight || 'rgba(74,139,201,0.15)'};
        }
      }
    }

    .qpd-error {
      font-size: 12px;
      color: #D32F2F;
      min-height: 18px;
      margin-bottom: 4px;
    }

    .qpd-attempts {
      font-size: 11px;
      color: #999;
      text-align: right;
      margin-bottom: 8px;
    }

    .qpd-hint-box {
      background: ${props => props.$theme?.accentLight || '#EBF2FA'};
      border: 1px solid ${props => props.$theme?.sideBorder || '#C4D5E7'};
      padding: 10px 12px;
      margin-bottom: 12px;
      font-size: 12px;
      line-height: 1.5;

      .qpd-hint-title {
        font-weight: bold;
        color: ${props => props.$theme?.accentDark || '#2B5F8E'};
        margin-bottom: 4px;
      }

      .qpd-hint-content {
        color: #444;
      }
    }
  }

  .qpd-footer {
    padding: 0 20px 16px;
    display: flex;
    justify-content: flex-end;
    gap: 8px;

    button {
      padding: 6px 16px;
      font-size: 12px;
      font-family: inherit;
      cursor: pointer;
      border: 1px solid ${props => props.$theme?.sideBorder || '#C4D5E7'};
      background: linear-gradient(to bottom, #FFFFFF 0%, #F0F4F8 100%);
      color: #333;

      &:hover {
        background: ${props => props.$theme?.sideHeader || 'linear-gradient(to bottom, #EBF2FA 0%, #D9E6F2 100%)'};
        border-color: ${props => props.$theme?.accent || '#4A8BC9'};
      }

      &.qpd-primary {
        background: ${props => props.$theme?.nav || 'linear-gradient(to bottom, #4A8BC9 0%, #3A7ABB 100%)'};
        color: white;
        border-color: ${props => props.$theme?.accentDark || '#2B5F8E'};

        &:hover {
          filter: brightness(1.05);
        }
      }

      &.qpd-hint {
        background: ${props => props.$theme?.accentLight || '#EBF2FA'};
        color: ${props => props.$theme?.accentDark || '#2B5F8E'};
        border-color: ${props => props.$theme?.accent || '#4A8BC9'};

        &:disabled {
          opacity: 0.5;
          cursor: default;
        }
      }

      &.qpd-skip {
        background: #FFF0F0;
        color: #C00;
        border-color: #E0A0A0;

        &:disabled {
          opacity: 0.5;
          cursor: default;
        }
      }
    }
  }
`;

/* ========== 组件逻辑 ========== */

const QZone = ({ userId, navigateTo }) => {
  const [activeTab, setActiveTab] = useState('home');
  const [userInfo, setUserInfo] = useState(null);
  const [shuoshuos, setShuoshuos] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notOpened, setNotOpened] = useState(false);

  const { recordPuzzleAttempt, getPuzzleAttempts } = useUserProgress();

  const [viewingItem, setViewingItem] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [shuoshuoPage, setShuoshuoPage] = useState(1);
  const blogsPerPage = 5;
  const shuoshuoPerPage = 10;

  // QZone密码对话框状态
  const [pwdDialog, setPwdDialog] = useState(null); // { type, item, puzzleId, allowSkip }
  const [pwdInput, setPwdInput] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [pwdHint, setPwdHint] = useState(null);
  const pwdInputRef = useRef(null);

  const theme = getTheme(userId);

  // 点击用户名跳转到对方空间
  const handleUserClick = (username) => {
    const qqId = NAME_TO_QQ[username];
    if (qqId && navigateTo) {
      navigateTo(`http://qzone.qq.com/${qqId}`);
    }
  };

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        setError(null);
        setNotOpened(false);
        setViewingItem(null);
        setActiveTab('home');
        setCurrentPage(1);
        setShuoshuoPage(1);

        const userDir = qzoneUserMap[userId];
        if (!userDir) {
          setNotOpened(true);
          return;
        }

        const [indexData, shuoshuoData, blogData] = await Promise.all([
          import(`../data/qzone/${userDir}/index.json`),
          import(`../data/qzone/${userDir}/shuoshuo.json`),
          import(`../data/qzone/${userDir}/blog.json`)
        ]);

        let processedBlogs = await Promise.all(blogData.default.map(async (blog) => {
          if (blog.contentPath) {
            const key = `../data/qzone/${userDir}/blogs/${blog.contentPath}`;
            if (blogContentModules[key]) {
              const mod = await blogContentModules[key]();
              return { ...blog, content: typeof mod === 'string' ? mod : mod.default };
            }
          }
          return blog;
        }));
        if (userDir === "linxiaoyu") {
          try {
            const encryptedDiary = await import(`../data/qzone/${userDir}/encrypted_diary.json`);
            processedBlogs.push({
              id: "encrypted_diary",
              title: encryptedDiary.default.title,
              time: "2016-02-15",
              content: encryptedDiary.default.content,
              encrypted: true,
              password: encryptedDiary.default.password
            });
          } catch (e) {
            console.log("No encrypted diary found");
          }
        }

        setUserInfo(indexData.default);
        setShuoshuos(shuoshuoData.default);
        setBlogs(processedBlogs);

        try {
          const albumsData = await import(`../data/qzone/${userDir}/albums.json`);
          setAlbums(albumsData.default);
        } catch (e) {
          console.log(`No albums for ${userDir}`);
          setAlbums([]);
        }
      } catch (err) {
        console.error("QZone Data Load Error:", err);
        setError(`Failed to load QZone data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [userId]);

  const openItem = (type, item) => {
    setViewingItem({ type, data: item });
  };

  const handleUnlock = (type, item) => {
    let puzzleId = null;
    if (type === 'album') {
      puzzleId = getPuzzleIdFromAlbum(item.name, userId);
    } else if (type === 'blog') {
      puzzleId = getPuzzleIdFromBlog(item.title, userId);
    }
    const allowSkip = puzzleId ? isAuxiliaryPuzzle(puzzleId) : false;
    setPwdDialog({ type, item, puzzleId, allowSkip, correctPassword: item.password || "123" });
    setPwdInput('');
    setPwdError('');
    setPwdHint(null);
    setTimeout(() => pwdInputRef.current?.focus(), 50);
  };

  const handlePwdSubmit = () => {
    if (!pwdInput) {
      setPwdError('请输入密码');
      return;
    }
    if (pwdInput === pwdDialog.correctPassword) {
      const { type, item } = pwdDialog;
      setPwdDialog(null);
      openItem(type, item);
    } else {
      if (pwdDialog.puzzleId) {
        recordPuzzleAttempt(pwdDialog.puzzleId);
      }
      setPwdError('密码错误，请重试');
      setPwdInput('');
      pwdInputRef.current?.focus();
    }
  };

  const handlePwdKeyDown = (e) => {
    if (e.key === 'Enter') handlePwdSubmit();
    else if (e.key === 'Escape') setPwdDialog(null);
  };

  const getPwdAvailableHint = () => {
    if (!pwdDialog?.puzzleId) return null;
    const config = puzzleHints[pwdDialog.puzzleId];
    if (!config) return null;
    const attempts = getPuzzleAttempts(pwdDialog.puzzleId);
    const available = config.hints.filter(h => attempts >= h.threshold);
    return available.length > 0 ? available[available.length - 1] : null;
  };

  const getPwdNextThreshold = () => {
    if (!pwdDialog?.puzzleId) return null;
    const config = puzzleHints[pwdDialog.puzzleId];
    if (!config) return null;
    const attempts = getPuzzleAttempts(pwdDialog.puzzleId);
    const next = config.hints.find(h => attempts < h.threshold);
    return next ? next.threshold : null;
  };

  const handleBlogClick = (blog) => {
    if (blog.encrypted) handleUnlock('blog', blog);
    else openItem('blog', blog);
  };

  const handleAlbumClick = (album) => {
    if (album.encrypted) handleUnlock('album', album);
    else openItem('album', album);
  };

  // 从新到旧排序
  const reversedShuoshuos = [...shuoshuos].reverse();
  const reversedBlogs = [...blogs].reverse();

  // 说说分页
  const shuoshuoTotalPages = Math.ceil(reversedShuoshuos.length / shuoshuoPerPage);
  const indexOfLastSS = shuoshuoPage * shuoshuoPerPage;
  const indexOfFirstSS = indexOfLastSS - shuoshuoPerPage;
  const currentShuoshuos = reversedShuoshuos.slice(indexOfFirstSS, indexOfLastSS);

  // 日志分页
  const blogTotalPages = Math.ceil(reversedBlogs.length / blogsPerPage);
  const indexOfLastBlog = currentPage * blogsPerPage;
  const indexOfFirstBlog = indexOfLastBlog - blogsPerPage;
  const currentBlogs = reversedBlogs.slice(indexOfFirstBlog, indexOfLastBlog);

  const renderPagination = (current, total, onChange) => {
    if (total <= 1) return null;
    const pageNumbers = [];
    for (let i = 1; i <= total; i++) pageNumbers.push(i);
    return (
      <Pagination $theme={theme}>
        <button className="page-btn" disabled={current === 1} onClick={() => onChange(current - 1)}>
          上一页
        </button>
        {pageNumbers.map(n => (
          <button key={n} className={`page-btn ${current === n ? 'active' : ''}`} onClick={() => onChange(n)}>
            {n}
          </button>
        ))}
        <button className="page-btn" disabled={current === total} onClick={() => onChange(current + 1)}>
          下一页
        </button>
      </Pagination>
    );
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'blog') setCurrentPage(1);
    if (tab === 'home') setShuoshuoPage(1);
  };

  if (loading) return <Container $theme={theme} style={{display:'flex',alignItems:'center',justifyContent:'center'}}>加载中...</Container>;

  if (notOpened) {
    return (
      <Container $theme={theme}>
        <Banner $theme={theme}>
          <BannerContent>
            <div className="info"><h1>QQ空间</h1></div>
          </BannerContent>
        </Banner>
        <NotOpenedContainer>
          <h2>该用户尚未开通QQ空间</h2>
          <p>Ta还没有开通QQ空间，暂时无法访问。</p>
        </NotOpenedContainer>
      </Container>
    );
  }

  if (error) return <Container $theme={theme} style={{padding:20,color:'#c00'}}>{error}</Container>;

  // 详情页
  if (viewingItem) {
    return (
      <Container $theme={theme}>
        <DetailView $theme={theme}>
          <DetailHeader $theme={theme}>
            <button className="back-btn" onClick={() => setViewingItem(null)}>返回</button>
            <h2>{viewingItem.type === 'blog' ? viewingItem.data.title : viewingItem.data.name}</h2>
          </DetailHeader>
          <DetailBody>
            {viewingItem.type === 'blog' && (
              <BlogDetailCard>
                <div className="blog-detail-header">
                  <h2>{viewingItem.data.title}</h2>
                  <div className="meta">发布于 {viewingItem.data.time}</div>
                </div>
                <div className="blog-detail-content">{viewingItem.data.content}</div>
              </BlogDetailCard>
            )}
            {viewingItem.type === 'album' && (
              <ContentCard $theme={theme}>
                <ContentCardHeader $theme={theme}>
                  <h3>{viewingItem.data.name}</h3>
                </ContentCardHeader>
                <PhotoGrid>
                  {viewingItem.data.images && viewingItem.data.images.map((img, idx) => (
                    <img key={idx} src={img} alt={`photo-${idx}`} onClick={() => window.open(img, '_blank')} title="点击查看大图"/>
                  ))}
                  {(!viewingItem.data.images || viewingItem.data.images.length === 0) && (
                    <p style={{padding:'20px',color:'#999'}}>该相册暂无照片。</p>
                  )}
                </PhotoGrid>
              </ContentCard>
            )}
          </DetailBody>
        </DetailView>
      </Container>
    );
  }

  // 主页面
  return (
    <Container $theme={theme}>
      <Banner $theme={theme}>
        <BannerContent>
          <img className="avatar" src={userInfo.avatar} alt="avatar" />
          <div className="info">
            <h1>{userInfo.title}</h1>
            <p>{userInfo.description}</p>
          </div>
        </BannerContent>
      </Banner>

      <NavBar $theme={theme}>
        <NavItem $active={activeTab === 'home'} $navActive={theme.navActive} onClick={() => handleTabChange('home')}>主页</NavItem>
        <NavItem $active={activeTab === 'blog'} $navActive={theme.navActive} onClick={() => handleTabChange('blog')}>日志</NavItem>
        <NavItem $active={activeTab === 'album'} $navActive={theme.navActive} onClick={() => handleTabChange('album')}>相册</NavItem>
        <NavItem $active={activeTab === 'profile'} $navActive={theme.navActive} onClick={() => handleTabChange('profile')}>个人档</NavItem>
      </NavBar>

      <MainLayout>
        <Sidebar>
          <SideCard $theme={theme}>
            <div className="card-title">个人信息</div>
            <div className="card-body" style={{textAlign:'center'}}>
              <img src={userInfo.avatar} alt="avatar" style={{width:80,height:80,borderRadius:4,border:'1px solid #ddd'}} />
              <div style={{marginTop:8,fontWeight:'bold',color:'#333',fontSize:14}}>{userInfo.username}</div>
              <div style={{marginTop:4,fontSize:11,color:'#888'}}>{userInfo.description}</div>
            </div>
          </SideCard>
          <SideCard $theme={theme}>
            <div className="card-title">模块导航</div>
            <SideNavItem $theme={theme} $active={activeTab === 'home'} onClick={() => handleTabChange('home')}>主页</SideNavItem>
            <SideNavItem $theme={theme} $active={activeTab === 'blog'} onClick={() => handleTabChange('blog')}>日志 ({blogs.length})</SideNavItem>
            <SideNavItem $theme={theme} $active={activeTab === 'album'} onClick={() => handleTabChange('album')}>相册 ({albums.length})</SideNavItem>
            <SideNavItem $theme={theme} $active={activeTab === 'profile'} onClick={() => handleTabChange('profile')}>个人档</SideNavItem>
          </SideCard>
          <SideCard $theme={theme}>
            <div className="card-title">统计</div>
            <div className="card-body" style={{fontSize:11,color:'#888',lineHeight:1.8}}>
              <div>说说: {shuoshuos.length}条</div>
              <div>日志: {blogs.length}篇</div>
              <div>相册: {albums.length}个</div>
            </div>
          </SideCard>
        </Sidebar>

        <ContentArea>
          {activeTab === 'home' && (
            <ContentCard $theme={theme}>
              <ContentCardHeader $theme={theme}>
                <h3>说说</h3>
                <span className="count">共{shuoshuos.length}条</span>
              </ContentCardHeader>
              <ContentCardBody>
                {currentShuoshuos.length > 0 ? currentShuoshuos.map(item => (
                  <ShuoshuoItem key={item.id} $theme={theme}>
                    <div className="ss-header">
                      <img className="ss-avatar" src={userInfo.avatar} alt="" />
                      <span className="ss-name" onClick={() => handleUserClick(userInfo.username)}>{userInfo.username}</span>
                      <span className="ss-time">{item.time}</span>
                    </div>
                    <div className="ss-content">{item.content}</div>
                    <div className="ss-actions">
                      <span>评论({item.comments ? item.comments.length : 0})</span>
                    </div>
                    {item.comments && item.comments.length > 0 && (
                      <div className="ss-comments">
                        {item.comments.map((c, i) => (
                          <div className="comment-item" key={i}>
                            <span className="c-name" onClick={(e) => { e.stopPropagation(); handleUserClick(c.user); }}>{c.user}</span>: {c.content}
                          </div>
                        ))}
                      </div>
                    )}
                  </ShuoshuoItem>
                )) : (
                  <div style={{padding:30,textAlign:'center',color:'#999',fontSize:13}}>暂无说说。</div>
                )}
              </ContentCardBody>
              {renderPagination(shuoshuoPage, shuoshuoTotalPages, setShuoshuoPage)}
            </ContentCard>
          )}

          {activeTab === 'blog' && (
            <ContentCard $theme={theme}>
              <ContentCardHeader $theme={theme}>
                <h3>日志</h3>
                <span className="count">共{blogs.length}篇</span>
              </ContentCardHeader>
              <ContentCardBody>
                {currentBlogs.length > 0 ? currentBlogs.map(blog => (
                  <BlogItem key={blog.id} $theme={theme} onClick={() => handleBlogClick(blog)}>
                    <div className="blog-icon">B</div>
                    <div className="blog-info">
                      <h4>
                        {blog.title}
                        {blog.encrypted && <span className="lock-icon" />}
                      </h4>
                      {blog.content && !blog.encrypted && (
                        <div className="blog-summary">{blog.content.substring(0, 60)}...</div>
                      )}
                      <div className="blog-meta">{blog.time}</div>
                    </div>
                  </BlogItem>
                )) : (
                  <div style={{padding:30,textAlign:'center',color:'#999',fontSize:13}}>暂无日志。</div>
                )}
              </ContentCardBody>
              {renderPagination(currentPage, blogTotalPages, setCurrentPage)}
            </ContentCard>
          )}

          {activeTab === 'album' && (
            <ContentCard $theme={theme}>
              <ContentCardHeader $theme={theme}>
                <h3>相册</h3>
                <span className="count">共{albums.length}个</span>
              </ContentCardHeader>
              {albums.length > 0 ? (
                <AlbumGrid>
                  {albums.map(album => (
                    <AlbumCard key={album.id} onClick={() => handleAlbumClick(album)}>
                      <div className="cover">
                        {album.encrypted && <div className="locked-overlay">已加密</div>}
                        {!album.encrypted && album.coverImg && <img src={album.coverImg} alt={album.name}/>}
                        {!album.encrypted && !album.coverImg && <div className="placeholder">暂无封面</div>}
                      </div>
                      <div className="album-name">{album.name}</div>
                    </AlbumCard>
                  ))}
                </AlbumGrid>
              ) : (
                <div style={{padding:30,textAlign:'center',color:'#999',fontSize:13}}>暂无相册。</div>
              )}
            </ContentCard>
          )}

          {activeTab === 'profile' && (
            <ContentCard $theme={theme}>
              <ContentCardHeader $theme={theme}>
                <h3>个人档</h3>
              </ContentCardHeader>
              <ProfileTable>
                <div className="profile-row">
                  <span className="label">昵称</span>
                  <span className="value">{userInfo.username}</span>
                </div>
                <div className="profile-row">
                  <span className="label">个性签名</span>
                  <span className="value">{userInfo.description}</span>
                </div>
              </ProfileTable>
            </ContentCard>
          )}
        </ContentArea>
      </MainLayout>

      {/* QQ空间密码对话框 */}
      {pwdDialog && (() => {
        const attempts = pwdDialog.puzzleId ? getPuzzleAttempts(pwdDialog.puzzleId) : 0;
        const availableHint = getPwdAvailableHint();
        const nextThreshold = getPwdNextThreshold();
        const canSkip = pwdDialog.allowSkip && attempts >= 10;

        return (
          <QZonePasswordOverlay onClick={(e) => { if (e.target === e.currentTarget) setPwdDialog(null); }}>
            <QZonePasswordDialog $theme={theme}>
              <div className="qpd-header">
                <span className="qpd-title">加密内容</span>
                <button className="qpd-close" onClick={() => setPwdDialog(null)}>x</button>
              </div>
              <div className="qpd-body">
                <div className="qpd-icon-row">
                  <div className="qpd-lock-icon">&#128274;</div>
                  <div className="qpd-message">此内容已加密，请输入密码访问。</div>
                </div>
                <div className="qpd-input-group">
                  <label>请输入访问密码:</label>
                  <input
                    ref={pwdInputRef}
                    type="password"
                    value={pwdInput}
                    onChange={(e) => { setPwdInput(e.target.value); setPwdError(''); }}
                    onKeyDown={handlePwdKeyDown}
                    placeholder="输入密码..."
                  />
                </div>
                <div className="qpd-error">{pwdError}</div>
                {pwdDialog.puzzleId && (
                  <div className="qpd-attempts">
                    已尝试 {attempts} 次
                    {nextThreshold && ` / 再尝试 ${nextThreshold - attempts} 次解锁提示`}
                  </div>
                )}
                {pwdHint && (
                  <div className="qpd-hint-box">
                    <div className="qpd-hint-title">{pwdHint.title}</div>
                    <div className="qpd-hint-content">{pwdHint.content}</div>
                  </div>
                )}
              </div>
              <div className="qpd-footer">
                {pwdDialog.puzzleId && (
                  <button
                    className="qpd-hint"
                    disabled={!availableHint}
                    onClick={() => { if (availableHint) setPwdHint(availableHint); }}
                    title={availableHint ? '查看提示' : nextThreshold ? `再尝试 ${nextThreshold - attempts} 次解锁` : '暂无提示'}
                  >
                    提示
                  </button>
                )}
                {pwdDialog.allowSkip && (
                  <button
                    className="qpd-skip"
                    disabled={!canSkip}
                    onClick={() => { if (canSkip) { const { type, item } = pwdDialog; setPwdDialog(null); openItem(type, item); } }}
                    title={canSkip ? '跳过此谜题' : '尝试10次后可跳过'}
                  >
                    跳过
                  </button>
                )}
                <button onClick={() => setPwdDialog(null)}>取消</button>
                <button className="qpd-primary" onClick={handlePwdSubmit}>确定</button>
              </div>
            </QZonePasswordDialog>
          </QZonePasswordOverlay>
        );
      })()}
    </Container>
  );
};

export default QZone;
