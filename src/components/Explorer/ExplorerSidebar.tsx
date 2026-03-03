import React from 'react';
import styled from 'styled-components';

const SidebarContainer = styled.div`
    width: 200px;
    background: #f0f0f0;
    border-right: 1px solid #d0d0d0;
    display: flex;
    flex-direction: column;
`;

const SidebarItem = styled.div`
    padding: 8px 12px;
    cursor: pointer;
    font-size: 12px;
    color: #333;
    border-bottom: 1px solid #e0e0e0;

    &:hover {
        background: #e0e0e0;
    }

    &.active {
        background: #0066cc;
        color: white;
    }
`;

interface ExplorerSidebarProps {
    activeItem?: string;
    onItemClick?: (item: string) => void;
}

const ExplorerSidebar: React.FC<ExplorerSidebarProps> = ({ activeItem = 'my-computer', onItemClick }) => {
    const items = [
        { id: 'my-computer', label: '我的电脑' },
        { id: 'my-documents', label: '我的文档' },
        { id: 'recycle-bin', label: '回收站' },
        { id: 'network', label: '网上邻居' }
    ];

    return (
        <SidebarContainer>
            {items.map(item => (
                <SidebarItem
                    key={item.id}
                    className={activeItem === item.id ? 'active' : ''}
                    onClick={() => onItemClick?.(item.id)}
                >
                    {item.label}
                </SidebarItem>
            ))}
        </SidebarContainer>
    );
};

export default ExplorerSidebar;
