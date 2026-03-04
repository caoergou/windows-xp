import React from 'react';
import styled from 'styled-components';
import XPIcon from '../XPIcon';
import { useTranslation } from 'react-i18next';

const Bar = styled.div`
    border-top: 1px solid rgba(255, 255, 255, 0.7);
    height: 22px;
    font-size: 11px;
    display: flex;
    align-items: center;
    padding: 0 2px 2px;
    box-shadow: inset 0 -2px 3px -1px #2d2d2d;
    background: linear-gradient(to right, #edede5 0%, #ede8cd 100%);
`;

const Label = styled.span`
    line-height: 100%;
    color: rgba(0, 0, 0, 0.5);
    padding: 5px;
    font-size: 11px;
    font-family: Tahoma, sans-serif;
    white-space: nowrap;
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
    position: absolute;
    white-space: nowrap;
    left: 16px;
    right: 17px;
    overflow: hidden;
    height: 100%;
    padding: 0 2px;
    font-size: 11px;
    font-family: Tahoma, "Microsoft YaHei", sans-serif;
    background: white;
    border: none;
    outline: none;
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
    height: 95%;
    position: relative;
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.2);
    cursor: pointer;
    font-size: 11px;
    font-family: Tahoma, sans-serif;
    gap: 3px;

    img {
        height: 95%;
        margin-right: 3px;
    }

    &:hover {
        filter: brightness(1.1);
    }

    &:active {
        filter: brightness(0.9);
    }
`;

interface IEAddressBarProps {
    value: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onGo?: () => void;
}

const IEAddressBar: React.FC<IEAddressBarProps> = ({ value, onChange, onGo }) => {
    const { t } = useTranslation();

    return (
        <Bar>
            <Label>{t('explorer.address')}</Label>
            <InputWrapper>
                <IconWrapper>
                    <XPIcon name="ie" size={14} />
                </IconWrapper>
                <Input
                    type="text"
                    value={value}
                    onChange={onChange}
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

export default IEAddressBar;
