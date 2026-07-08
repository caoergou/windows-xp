import React from 'react';
import {
  Footer,
  LoadingBar,
  FooterStatus,
  StatusIcon,
  StatusText,
  FooterBlock,
  FooterRight,
  FooterDots,
} from '../styled';

interface StatusBarProps {
  isLoading: boolean;
  statusText: string;
}

const StatusBar: React.FC<StatusBarProps> = ({ isLoading, statusText }) => (
  <Footer>
    <LoadingBar $visible={isLoading} />
    <FooterStatus>
      <StatusIcon src="/icons/ie.png" alt="IE" $spinning={isLoading} />
      <StatusText>{statusText}</StatusText>
    </FooterStatus>
    <FooterBlock />
    <FooterBlock />
    <FooterBlock />
    <FooterBlock />
    <FooterRight>
      <img src="/icons/earth.png" alt="Internet" />
      <span>Internet</span>
      <FooterDots />
    </FooterRight>
  </Footer>
);

export default StatusBar;
