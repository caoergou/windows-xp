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
    font-family: "Tahoma", "SimSun", "Microsoft YaHei", sans-serif;
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
    font-family: "Tahoma", "SimSun", "Microsoft YaHei", sans-serif;
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

const GoIcon = styled.span`
    display: inline-flex;
    width: 14px;
    height: 14px;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;

    img {
        width: 14px;
        height: 14px;
        display: block;
    }
`;

const GoButton = styled.button`
    display: flex;
    align-items: center;
    padding: 0 6px 0 2px;
    height: auto;
    min-height: 0;
    position: relative;
    background: transparent !important;
    border: none !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    cursor: pointer;
    font-size: 11px;
    font-family: "Tahoma", "SimSun", "Microsoft YaHei", sans-serif;
    gap: 2px;
    line-height: 1;

    img {
        margin: 0;
    }

    &:hover {
        filter: brightness(1.08);
    }

    &:active {
        filter: brightness(0.92);
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
                    data-testid="ie-address-input"
                    value={value}
                    onChange={onChange}
                    onKeyDown={(e) => e.key === 'Enter' && onGo?.()}
                />
                <DropArrow>
                    <XPIcon name="dropdown" size={15} />
                </DropArrow>
            </InputWrapper>
            <GoButton onClick={onGo}>
                <GoIcon>
                    <XPIcon name="go" size={14} />
                </GoIcon>
                <span>{t('internetExplorer.addressBar.go')}</span>
            </GoButton>
        </Bar>
    );
};

export default IEAddressBar;
