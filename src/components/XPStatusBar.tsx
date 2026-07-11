import styled from 'styled-components';

/**
 * XP status bar (#78): a row of sunken fields, value-for-value from xp.css's
 * `.status-bar` / `.status-bar-field`.
 *
 * ```tsx
 * <XPStatusBar>
 *   <XPStatusBarField>Ready</XPStatusBarField>
 *   <XPStatusBarField>CPU: 3%</XPStatusBarField>
 * </XPStatusBar>
 * ```
 */
export const XPStatusBar = styled.div`
  margin: 0 1px;
  display: flex;
  gap: 1px;
  font-family: 'Tahoma', 'SimSun', 'Microsoft YaHei', sans-serif;
  font-size: 11px;
  color: #000;
`;

export const XPStatusBarField = styled.div`
  box-shadow: inset -1px -1px #dfdfdf, inset 1px 1px grey;
  flex-grow: 1;
  padding: 2px 3px;
  margin: 0;
`;
