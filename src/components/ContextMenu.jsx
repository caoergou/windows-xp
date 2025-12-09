import { useEffect, useRef } from 'react';
import styled from 'styled-components';

const ContextMenuContainer = styled.div`
    position: fixed;
    background: white;
    border: 1px solid #0055EA;
    border-radius: 3px;
    box-shadow: 2px 2px 5px rgba(0,0,0,0.3);
    padding: 2px;
    z-index: 99999;
    min-width: 150px;
    font-size: 12px;
    left: ${props => props.x}px;
    top: ${props => props.y}px;
`;

const MenuItem = styled.div`
    padding: 8px 20px;
    cursor: pointer;
    display: flex;
    align-items: center;
    color: #333;

    &:hover {
        background: #316AC5;
        color: white;
    }

    &:active {
        background: #254587;
    }

    img {
        width: 16px;
        height: 16px;
        margin-right: 8px;
    }
`;

const MenuSeparator = styled.div`
    height: 1px;
    background: #DDD;
    margin: 2px 0;
`;

const ContextMenu = ({ visible, x, y, onClose, menuItems }) => {
    const menuRef = useRef(null);

    useEffect(() => {
        if (visible) {
            const handleClickOutside = (event) => {
                if (menuRef.current && !menuRef.current.contains(event.target)) {
                    onClose();
                }
            };

            const handleContextMenu = (event) => {
                // Don't close the menu if contextmenu happens inside the menu
                if (menuRef.current && menuRef.current.contains(event.target)) {
                    return;
                }
                event.preventDefault();
                onClose();
            };

            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('contextmenu', handleContextMenu);

            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
                document.removeEventListener('contextmenu', handleContextMenu);
            };
        }
    }, [visible, onClose]);

    // 只有当菜单可见时才计算位置和渲染
    if (!visible) return null;

    // 计算菜单位置，避免超出屏幕边界
    const calculatePosition = () => {
        const adjustedX = Math.max(5, Math.min(x, window.innerWidth - 160));
        const adjustedY = Math.max(5, Math.min(y, window.innerHeight - 200));
        return { x: adjustedX, y: adjustedY };
    };

    const position = calculatePosition();

    return (
        <ContextMenuContainer ref={menuRef} x={position.x} y={position.y}>
            {menuItems.map((item, index) => {
                if (item.type === 'separator') {
                    return <MenuSeparator key={index} />;
                }

                return (
                    <MenuItem
                        key={index}
                        onClick={() => {
                            if (item.action) {
                                item.action();
                            }
                            onClose();
                        }}
                        disabled={item.disabled}
                    >
                        {item.icon && <img src={item.icon} alt="" onError={(e) => {e.target.style.display='none'}} />}
                        {item.label}
                    </MenuItem>
                );
            })}
        </ContextMenuContainer>
    );
};

export default ContextMenu;