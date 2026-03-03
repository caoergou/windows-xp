import React from 'react';
import styled from 'styled-components';
import XPIcon from '../XPIcon';

const Bar = styled.div`
    height: 26px;
    background: #ECE9D8;
    border-bottom: 1px solid #ACA899;
    display: flex;
    align-items: center;
    padding: 0 4px;
    gap: 3px;
`;

const Label = styled.span`
    font-size: 11px;
    font-family: Tahoma, sans-serif;
    color: #000;
    white-space: nowrap;
    flex-shrink: 0;
`;

const InputWrapper = styled.div`
    flex: 1;
    height: 20px;
    display: flex;
    align-items: center;
    background: white;
    border-top: 1px solid #7F9DB9;
    border-left: 1px solid #7F9DB9;
    border-bottom: 1px solid #DFDFDF;
    border-right: 1px solid #DFDFDF;
    padding: 0 2px;
    gap: 2px;
`;

const Input = styled.input`
    flex: 1;
    height: 16px;
    padding: 0 2px;
    font-size: 11px;
    font-family: Tahoma, "Microsoft YaHei", sans-serif;
    background: white;
    border: none;
    outline: none;
`;

const DropArrow = styled.div`
    width: 16px;
    height: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-left: 1px solid #ACA899;
    cursor: default;
    font-size: 8px;
    color: #333;
    flex-shrink: 0;

    &:hover {
        background: #C1D2EE;
    }
`;

/* 绿色转到按钮 */
const GoButton = styled.button`
    height: 22px;
    padding: 0 6px;
    display: flex;
    align-items: center;
    gap: 3px;
    font-size: 11px;
    font-family: Tahoma, sans-serif;
    background: #ECE9D8;
    border-top: 1px solid #FFF;
    border-left: 1px solid #FFF;
    border-bottom: 1px solid #7F7F7F;
    border-right: 1px solid #7F7F7F;
    cursor: pointer;
    white-space: nowrap;
    flex-shrink: 0;

    .go-arrow {
        color: #2A7A2A;
        font-size: 14px;
        font-weight: bold;
    }

    &:hover {
        background: #C1D2EE;
    }

    &:active {
        border-top: 1px solid #7F7F7F;
        border-left: 1px solid #7F7F7F;
        border-bottom: 1px solid #FFF;
        border-right: 1px solid #FFF;
    }
`;

interface AddressBarProps {
    address: string;
    onAddressChange?: (address: string) => void;
    onGo?: () => void;
}

const AddressBar: React.FC<AddressBarProps> = ({ address, onAddressChange, onGo }) => {
    return (
        <Bar>
            <Label>地址(D)</Label>
            <InputWrapper>
                <XPIcon name="folder" size={14} />
                <Input
                    type="text"
                    value={address}
                    onChange={(e) => onAddressChange?.(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && onGo?.()}
                    placeholder="输入路径..."
                />
                <DropArrow>▾</DropArrow>
            </InputWrapper>
            <GoButton onClick={onGo}>
                <span className="go-arrow">→</span>
                转到
            </GoButton>
        </Bar>
    );
};

export default AddressBar;
