import React from 'react';
import styled from 'styled-components';
import XPIcon from '../XPIcon';

const Bar = styled.div`
    flex-shrink: 0;
    border-top: 1px solid rgba(255, 255, 255, 0.7);
    height: 20px;
    font-size: 11px;
    display: flex;
    align-items: center;
    padding: 0 2px;
    box-shadow: inset 0 -2px 3px -1px #b0b0b0;
    background: linear-gradient(to right, #edede5 0%, #ede8cd 100%);
`;

const Label = styled.span`
    line-height: 100%;
    color: rgba(0, 0, 0, 0.5);
    padding: 5px;
    font-size: 11px;
    font-family: Tahoma, sans-serif;
    white-space: nowrap;
    flex-shrink: 0;
`;

const InputWrapper = styled.div`
    border: rgba(122, 122, 255, 0.6) 1px solid;
    height: 100%;
    display: flex;
    flex: 1;
    align-items: center;
    background-color: white;
    position: relative;
`;

const Input = styled.input`
    white-space: nowrap;
    position: absolute;
    white-space: nowrap;
    left: 16px;
    right: 17px;
    height: 100%;
    padding: 0 2px;
    font-size: 11px;
    font-family: Tahoma, "Microsoft YaHei", sans-serif;
    background: white;
    border: none;
    outline: none;
    overflow: hidden;
`;

const IconWrapper = styled.div`
    width: 14px;
    height: 14px;
    margin-left: 2px;
`;

const DropArrow = styled.div`
    width: 15px;
    height: 15px;
    right: 1px;
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;

    &:hover {
        filter: brightness(1.1);
    }
`;

const GoButton = styled.button`
    display: flex;
    align-items: center;
    padding: 0 18px 0 5px;
    height: 100%;
    position: relative;
    background: transparent;
    border: none;
    cursor: pointer;
    font-size: 11px;
    font-family: Tahoma, sans-serif;
    gap: 3px;

    img {
        height: 95%;
        border: 1px solid rgba(255, 255, 255, 0.2);
        margin-right: 3px;
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
            <Label>地址</Label>
            <InputWrapper>
                <IconWrapper>
                    <XPIcon name="folder" size={14} />
                </IconWrapper>
                <Input
                    type="text"
                    value={address}
                    onChange={(e) => onAddressChange?.(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && onGo?.()}
                />
                <DropArrow>
                    <XPIcon name="dropdown" size={15} />
                </DropArrow>
            </InputWrapper>
            <GoButton onClick={onGo}>
                <XPIcon name="go" size={16} />
                <span>转到</span>
            </GoButton>
        </Bar>
    );
};

export default AddressBar;
