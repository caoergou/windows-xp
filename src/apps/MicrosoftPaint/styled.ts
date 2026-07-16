import styled from 'styled-components';

// MicrosoftPaint styled-components (#163/A).

export const Wrap = styled.div`
  width: 100%;
  height: 100%;
  background: #ece9d8;
  display: flex;
  flex-direction: column;
  padding: 6px;
  box-sizing: border-box;
  font-family: 'Tahoma', 'SimSun', 'Microsoft YaHei', sans-serif;
  font-size: 12px;
  user-select: none;

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }
`;

export const MenuBar = styled.div`
  height: 20px;
  background: linear-gradient(to bottom, #f0f0f0 0%, #e0e0e0 100%);
  border-bottom: 1px solid #808080;
  display: flex;
  align-items: center;
  padding: 0 2px;
  font-size: 11px;
  font-family: 'Tahoma', 'SimSun', 'Microsoft YaHei', sans-serif;
  flex-shrink: 0;
  margin: -6px -6px 6px -6px;
`;

export const MenuItemWrapper = styled.div`
  position: relative;
`;

export const MenuItem = styled.div<{ $active?: boolean }>`
  padding: 2px 8px;
  cursor: pointer;
  background: ${p => (p.$active ? '#316AC5' : 'transparent')};
  color: ${p => (p.$active ? 'white' : 'inherit')};

  &:hover {
    background: #316ac5;
    color: white;
  }
`;

export const DropdownMenu = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  min-width: 160px;
  background: #f0f0f0;
  border: 1px solid #000;
  box-shadow: 2px 2px 0px #808080;
  padding: 2px 0;
  z-index: 9999;
  font-size: 12px;
  font-family: 'Tahoma', 'SimSun', 'Microsoft YaHei', sans-serif;
`;

export const DropdownItem = styled.div<{ $disabled?: boolean }>`
  padding: 3px 24px 3px 24px;
  cursor: ${p => (p.$disabled ? 'default' : 'pointer')};
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: ${p => (p.$disabled ? '#A0A0A0' : '#000')};
  position: relative;
  white-space: nowrap;

  &:hover {
    background: ${p => (p.$disabled ? 'transparent' : '#316AC5')};
    color: ${p => (p.$disabled ? '#A0A0A0' : 'white')};
  }

  .shortcut {
    margin-left: 24px;
    font-size: 11px;
    color: inherit;
    opacity: 0.8;
  }
`;

export const DropdownSeparator = styled.div`
  height: 1px;
  background: #808080;
  margin: 3px 2px;
`;

export const Toolbar = styled.div`
  display: flex;
  gap: 4px;
  margin-bottom: 6px;
  padding: 4px;
  background: #ece9d8;
  border: 1px solid;
  border-color: #ffffff #808080 #808080 #ffffff;
  overflow: hidden;
  box-sizing: border-box;
`;

export const ToolBtn = styled.button`
  width: 28px;
  height: 28px;
  flex: 0 0 28px;
  cursor: pointer;
  font-size: 12px;
  font-family: inherit;
  border: 1px solid;
  border-color: #ffffff #808080 #808080 #ffffff;
  outline: none;
  background: #ece9d8;
  display: flex;
  align-items: center;
  justify-content: center;

  &:active {
    border-color: #808080 #ffffff #ffffff #808080;
    padding-top: 1px;
    padding-left: 1px;
  }

  &.active {
    background: #0a2463;
    color: #ffffff;
  }
`;

export const ColorPicker = styled.div`
  display: flex;
  gap: 2px;
  margin-left: auto;
  align-items: center;
  justify-content: flex-end;
  min-width: 0;
  overflow: hidden;
`;

export const ColorSwatch = styled.div<{ $color: string; $active: boolean }>`
  width: 24px;
  height: 24px;
  flex: 0 0 24px;
  box-sizing: border-box;
  border: 2px solid ${p => (p.$active ? '#ff0000' : '#808080')};
  background: ${p => p.$color};
  cursor: pointer;
`;

export const CanvasWrapper = styled.div`
  flex: 1;
  background: #ffffff;
  border: 2px inset #808080;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
`;

export const Canvas = styled.canvas`
  background: #ffffff;
`;
