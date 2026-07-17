import React, { useState } from 'react';
import styled from 'styled-components';
import { resolveOSTheme } from '../themes/useOSTheme';

/* brand-palette:start — centrally declared app-identity colours (#213 batch 4).
   Exempt from the guard:purity hex ratchet; NOT COLORS tokens on purpose: this
   app keeps its own period look even if the OS theme is swapped (#143). */
const PALETTE = {
  blue700: '#1C3D73',
  blue600: '#1C73A8',
  green700: '#217A3C',
  blue800: '#24324A',
  blue6002: '#2B5AA8',
  blue500: '#356FC0',
  blue6003: '#4A5A72',
  blue5002: '#4F7EC9',
  blue400: '#5F8ED6',
  blue5003: '#6A7A92',
  blue300: '#6F9CE0',
  blue200: '#B8C6DE',
  orange600: '#C0491F',
  blue100: '#CDD7E6',
  blue1002: '#D3E2F7',
  blue1003: '#DFE7F3',
  blue1004: '#E6EDF6',
  blue1005: '#E9F1FB',
  blue1006: '#EEF2F8',
  blue1007: '#F6F9FD',
  white: '#FFFFFF',
};
/* brand-palette:end */

/**
 * Microsoft Office — a 2000s-style suite launcher for the `en` culture package
 * (#123). Original parody artwork/tiles; no ripped brand assets. Pick an app to
 * "start" it; a recent-documents list rounds out the era feel.
 */
const Wrap = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: ${PALETTE.blue1006};
  font-family: ${({ theme }) => resolveOSTheme(theme).fonts.CLASSIC};
  font-size: 12px;
  color: ${PALETTE.blue800};
  user-select: none;
  overflow: hidden;
`;
const Header = styled.div`
  background: linear-gradient(to bottom, ${PALETTE.blue5002} 0%, ${PALETTE.blue6002} 100%);
  border-bottom: 1px solid ${PALETTE.blue700};
  padding: 10px 12px;
  color: ${PALETTE.white};
  flex-shrink: 0;
  .t {
    font-size: 16px;
    font-weight: bold;
    text-shadow: 0 1px 1px rgba(0, 0, 0, 0.3);
  }
  .v {
    font-size: 11px;
    color: ${PALETTE.blue1002};
  }
`;
const Body = styled.div`
  flex: 1;
  display: flex;
  min-height: 0;
`;
const Tiles = styled.div`
  flex: 1;
  padding: 14px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  align-content: start;
`;
const Tile = styled.button<{ $c: string }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border: 1px solid ${PALETTE.blue200};
  border-radius: 4px;
  background: ${PALETTE.white};
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  &:hover {
    border-color: ${p => p.$c};
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
  }
  &:active {
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.2);
  }
  .glyph {
    width: 34px;
    height: 34px;
    border-radius: 4px;
    background: ${p => p.$c};
    color: ${PALETTE.white};
    font-weight: bold;
    font-size: 18px;
    font-family: Georgia, 'Times New Roman', serif;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .n {
    font-weight: bold;
  }
  .d {
    font-size: 11px;
    color: ${PALETTE.blue5003};
  }
`;
const Recent = styled.div`
  width: 190px;
  border-left: 1px solid ${PALETTE.blue100};
  background: ${PALETTE.blue1007};
  padding: 10px;
  flex-shrink: 0;
  overflow-y: auto;
  .h {
    font-weight: bold;
    color: ${PALETTE.blue6002};
    margin-bottom: 6px;
  }
  .doc {
    display: flex;
    gap: 6px;
    padding: 4px 2px;
    border-bottom: 1px solid ${PALETTE.blue1004};
    cursor: default;
    &:hover {
      background: ${PALETTE.blue1005};
    }
  }
`;
const Splash = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  text-align: center;
  .glyph {
    width: 64px;
    height: 64px;
    border-radius: 8px;
    color: ${PALETTE.white};
    font-weight: bold;
    font-size: 34px;
    font-family: Georgia, serif;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
  }
  .big {
    font-size: 15px;
    font-weight: bold;
  }
`;
const Btn = styled.button`
  height: 26px;
  padding: 0 16px;
  border: 1px solid ${PALETTE.blue700};
  border-radius: 3px;
  cursor: pointer;
  color: ${PALETTE.white};
  font-family: inherit;
  background: linear-gradient(to bottom, ${PALETTE.blue400}, ${PALETTE.blue6002});
  &:hover {
    background: linear-gradient(to bottom, ${PALETTE.blue300}, ${PALETTE.blue500});
  }
`;
const Footer = styled.div`
  border-top: 1px solid ${PALETTE.blue100};
  background: ${PALETTE.blue1003};
  padding: 4px 10px;
  font-size: 11px;
  color: ${PALETTE.blue6003};
  flex-shrink: 0;
`;

const APPS = [
  { key: 'Word', glyph: 'W', color: PALETTE.blue6002, desc: 'Word Processor' },
  { key: 'Excel', glyph: 'X', color: PALETTE.green700, desc: 'Spreadsheet' },
  { key: 'PowerPoint', glyph: 'P', color: PALETTE.orange600, desc: 'Presentations' },
  { key: 'Outlook', glyph: 'O', color: PALETTE.blue600, desc: 'Mail & Calendar' },
];

const RECENT = [
  'Resume_final_FINAL.doc',
  'Budget 2006.xls',
  'Science Fair.ppt',
  'Homework.doc',
  'Address Book.xls',
];

const MicrosoftOffice: React.FC<{ windowId?: string }> = () => {
  const [open, setOpen] = useState<(typeof APPS)[number] | null>(null);

  if (open) {
    return (
      <Wrap data-testid="msoffice">
        <Header>
          <div className="t">Microsoft {open.key}</div>
          <div className="v">Microsoft Office 2003</div>
        </Header>
        <Splash>
          <div className="glyph" style={{ background: open.color }}>
            {open.glyph}
          </div>
          <div>
            <div className="big">{open.key} is starting…</div>
            <div style={{ color: PALETTE.blue5003 }}>Creating a new blank document.</div>
          </div>
          <Btn data-testid="msoffice-back" onClick={() => setOpen(null)}>
            ← Back to Office
          </Btn>
        </Splash>
        <Footer>Microsoft Office 2003 · Product activated</Footer>
      </Wrap>
    );
  }

  return (
    <Wrap data-testid="msoffice">
      <Header>
        <div className="t">Microsoft Office</div>
        <div className="v">Office 2003 · Choose a program to begin</div>
      </Header>
      <Body>
        <Tiles>
          {APPS.map(a => (
            <Tile
              key={a.key}
              $c={a.color}
              data-testid={`msoffice-${a.key.toLowerCase()}`}
              onClick={() => setOpen(a)}
            >
              <span className="glyph" style={{ background: a.color }}>
                {a.glyph}
              </span>
              <span>
                <div className="n">Microsoft {a.key}</div>
                <div className="d">{a.desc}</div>
              </span>
            </Tile>
          ))}
        </Tiles>
        <Recent>
          <div className="h">Recent Documents</div>
          {RECENT.map(d => (
            <div className="doc" key={d}>
              📄 <span>{d}</span>
            </div>
          ))}
        </Recent>
      </Body>
      <Footer>Microsoft Office 2003 · Product activated</Footer>
    </Wrap>
  );
};

export default MicrosoftOffice;
