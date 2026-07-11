import React, { useState } from 'react';
import styled from 'styled-components';

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
  background: #eef2f8;
  font-family: 'Tahoma', 'MS Sans Serif', sans-serif;
  font-size: 12px;
  color: #24324a;
  user-select: none;
  overflow: hidden;
`;
const Header = styled.div`
  background: linear-gradient(to bottom, #4f7ec9 0%, #2b5aa8 100%);
  border-bottom: 1px solid #1c3d73;
  padding: 10px 12px;
  color: #fff;
  flex-shrink: 0;
  .t {
    font-size: 16px;
    font-weight: bold;
    text-shadow: 0 1px 1px rgba(0, 0, 0, 0.3);
  }
  .v {
    font-size: 11px;
    color: #d3e2f7;
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
  border: 1px solid #b8c6de;
  border-radius: 4px;
  background: #fff;
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
    color: #fff;
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
    color: #6a7a92;
  }
`;
const Recent = styled.div`
  width: 190px;
  border-left: 1px solid #cdd7e6;
  background: #f6f9fd;
  padding: 10px;
  flex-shrink: 0;
  overflow-y: auto;
  .h {
    font-weight: bold;
    color: #2b5aa8;
    margin-bottom: 6px;
  }
  .doc {
    display: flex;
    gap: 6px;
    padding: 4px 2px;
    border-bottom: 1px solid #e6edf6;
    cursor: default;
    &:hover {
      background: #e9f1fb;
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
    color: #fff;
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
  border: 1px solid #1c3d73;
  border-radius: 3px;
  cursor: pointer;
  color: #fff;
  font-family: inherit;
  background: linear-gradient(to bottom, #5f8ed6, #2b5aa8);
  &:hover {
    background: linear-gradient(to bottom, #6f9ce0, #356fc0);
  }
`;
const Footer = styled.div`
  border-top: 1px solid #cdd7e6;
  background: #dfe7f3;
  padding: 4px 10px;
  font-size: 11px;
  color: #4a5a72;
  flex-shrink: 0;
`;

const APPS = [
  { key: 'Word', glyph: 'W', color: '#2b5aa8', desc: 'Word Processor' },
  { key: 'Excel', glyph: 'X', color: '#217a3c', desc: 'Spreadsheet' },
  { key: 'PowerPoint', glyph: 'P', color: '#c0491f', desc: 'Presentations' },
  { key: 'Outlook', glyph: 'O', color: '#1c73a8', desc: 'Mail & Calendar' },
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
            <div style={{ color: '#6a7a92' }}>Creating a new blank document.</div>
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
