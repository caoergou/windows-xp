import React from 'react';
import { Container, MainArea, Footer } from '../styled';

interface BrowserChromeProps {
  children: React.ReactNode;
  statusBar: React.ReactNode;
}

const BrowserChrome: React.FC<BrowserChromeProps> = ({ children, statusBar }) => (
  <Container>
    <MainArea>{children}</MainArea>
    <Footer>{statusBar}</Footer>
  </Container>
);

export default BrowserChrome;
