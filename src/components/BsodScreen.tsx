import React from 'react';
import styled from 'styled-components';

const BsodContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #0033a0;
  color: white;
  font-family: 'Perfect DOS VGA 437 Win', 'Lucida Console', 'Courier New', monospace;
  font-size: 14px;
  padding: 40px 60px;
  z-index: 2147483647;
  cursor: none;
  overflow: hidden;
  white-space: pre-wrap;
  line-height: 1.6;
`;

const BsodHeader = styled.div`
  font-size: 18px;
  margin-bottom: 24px;
`;

const BsodScreen: React.FC<{ onClick?: () => void }> = ({ onClick }) => {
  return (
    <BsodContainer onClick={onClick} data-testid="bsod-screen">
      <BsodHeader>
        {'*** STOP: 0x0000007B (0xF78D2524, 0xC0000034, 0x00000000, 0x00000000)'}
      </BsodHeader>
      {`A problem has been detected and Windows has been shut down to prevent damage

to your computer.

UNMOUNTABLE_BOOT_VOLUME

If this is the first time you've seen this stop error screen,
restart your computer. If this screen appears again, follow
these steps:

Check to make sure any new hardware or software is properly installed.
Ask your hardware or software manufacturer for any Windows updates you
might need.

If problems continue, disable or remove any newly installed hardware
or software. Disable BIOS memory options such as caching or shadowing.
If you need to use Safe Mode to remove or disable components, restart
your computer, press F8 to select Advanced Startup Options, and then
select Safe Mode.

Technical information:

*** STOP: 0x0000007B (0xF78D2524, 0xC0000034, 0x00000000, 0x00000000)

***  easter_egg.sys - Address F78D2524 base at F78C1000, DateStamp 3dd991eb

Beginning dump of physical memory.
Physical memory dump complete.
Contact your system administrator or technical support group for further
assistance.

Click anywhere to return to Windows.`}
    </BsodContainer>
  );
};

export default BsodScreen;
