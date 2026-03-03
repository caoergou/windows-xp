import React from 'react';
import styled from 'styled-components';

const AddressBarContainer = styled.div`
    height: 30px;
    background: white;
    border-bottom: 1px solid #d0d0d0;
    display: flex;
    align-items: center;
    padding: 0 8px;
    gap: 8px;
`;

const AddressLabel = styled.span`
    font-size: 12px;
    color: #666;
`;

const AddressInput = styled.input`
    flex: 1;
    height: 22px;
    padding: 0 6px;
    font-size: 12px;
    font-family: inherit;
    border: 1px solid #d0d0d0;
    border-radius: 3px;
    outline: none;

    &:focus {
        border-color: #0066cc;
        box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.2);
    }
`;

const GoButton = styled.button`
    height: 22px;
    padding: 0 12px;
    font-size: 12px;
    font-family: inherit;
    background: linear-gradient(to bottom, #ffffff 0%, #f0f0f0 100%);
    border: 1px solid #d0d0d0;
    border-radius: 3px;
    cursor: pointer;

    &:hover {
        background: linear-gradient(to bottom, #f0f0f0 0%, #e0e0e0 100%);
    }

    &:active {
        background: linear-gradient(to bottom, #e0e0e0 0%, #d0d0d0 100%);
    }
`;

interface AddressBarProps {
    address: string;
    onAddressChange?: (address: string) => void;
    onGo?: () => void;
}

const AddressBar: React.FC<AddressBarProps> = ({ address, onAddressChange, onGo }) => {
    return (
        <AddressBarContainer>
            <AddressLabel>地址:</AddressLabel>
            <AddressInput
                type="text"
                value={address}
                onChange={(e) => onAddressChange?.(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onGo?.()}
                placeholder="输入路径..."
            />
            <GoButton onClick={onGo}>转到</GoButton>
        </AddressBarContainer>
    );
};

export default AddressBar;
