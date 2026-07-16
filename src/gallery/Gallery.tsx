import React, { useState } from 'react';
import styled from 'styled-components';
import { XPButton } from '../components/XPButton';
import { XPTextInput } from '../components/XPTextInput';
import { XPCheckbox, XPRadio } from '../components/XPCheckbox';
import { XPSelect } from '../components/XPSelect';
import { XPProgressBar } from '../components/XPProgressBar';
import { XPTooltip } from '../components/XPTooltip';
import { BalloonTip } from '../components/BalloonTip';
import { XPMenuBar, XPMenuBarItem } from '../components/XPMenuBar';
import { XPGroupBox } from '../components/XPGroupBox';
import { XPStatusBar, XPStatusBarField } from '../components/XPStatusBar';
import { XPTabs } from '../components/XPTabs';
import { XPDialog } from '../components/XPDialog';
import { xpTrackbarStyles } from '../theme';
import { COLORS, FONTS } from '../constants';

/**
 * Micro-component gallery (#99 / #78). Renders every shared XP primitive on one
 * page so each can be screenshot-compared against real XP and locked into a
 * Playwright visual-regression baseline. Each section carries a stable
 * `data-testid` the visual spec targets.
 */

const Page = styled.div`
  min-height: 100vh;
  background: ${COLORS.SURFACE};
  padding: 24px;
  font-family: ${FONTS.UI};
  font-size: 11px;
  color: ${COLORS.BLACK};
`;

const Section = styled.section`
  margin-bottom: 20px;
  background: ${COLORS.WHITE};
  border: 1px solid ${COLORS.DIVIDER_GREY};
  padding: 12px 14px;
  max-width: 620px;
`;

const Title = styled.h2`
  margin: 0 0 10px;
  font-size: 13px;
  font-weight: bold;
  color: ${COLORS.BUTTON_BORDER};
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  margin-bottom: 8px;
`;

const TooltipSwatch = styled.div`
  display: inline-block;
  padding: 1px 4px 2px;
  background: ${COLORS.TOOLTIP_BG};
  border: 1px solid ${COLORS.BLACK};
  font-size: 11px;
  box-shadow: 1px 1px 1px rgba(0, 0, 0, 0.25);
`;

const Slider = styled.input`
  width: 180px;
  ${xpTrackbarStyles}
`;

const Gallery: React.FC = () => {
  const [check, setCheck] = useState(true);
  const [check2, setCheck2] = useState(false);
  const [radio, setRadio] = useState('a');
  const [slider, setSlider] = useState(60);

  return (
    // The `.windows-xp-root` class is what the scoped xp.css hangs off of.
    <div className="windows-xp-root">
      <Page data-testid="gallery">
        <h1 style={{ fontSize: 18, color: COLORS.BUTTON_BORDER, marginTop: 0 }}>
          XP Micro-component Gallery
        </h1>

        <Section data-testid="gallery-buttons">
          <Title>Buttons — XPButton</Title>
          <Row>
            <XPButton>OK</XPButton>
            <XPButton>Cancel</XPButton>
            <XPButton disabled>Disabled</XPButton>
            <XPButton style={{ minWidth: 100 }}>Wide button</XPButton>
          </Row>
        </Section>

        <Section data-testid="gallery-inputs">
          <Title>Text input — XPTextInput</Title>
          <Row>
            <XPTextInput defaultValue="Editable text" />
            <XPTextInput placeholder="Placeholder…" />
            <XPTextInput defaultValue="Disabled" disabled />
          </Row>
        </Section>

        <Section data-testid="gallery-checkboxes">
          <Title>Checkbox / Radio — XPCheckbox / XPRadio</Title>
          <Row>
            <XPCheckbox
              checked={check}
              onChange={e => setCheck(e.target.checked)}
              label="Checked"
            />
            <XPCheckbox
              checked={check2}
              onChange={e => setCheck2(e.target.checked)}
              label="Unchecked"
            />
            <XPCheckbox checked disabled readOnly label="Disabled" />
          </Row>
          <Row>
            <XPRadio
              name="g"
              checked={radio === 'a'}
              onChange={() => setRadio('a')}
              label="Option A"
            />
            <XPRadio
              name="g"
              checked={radio === 'b'}
              onChange={() => setRadio('b')}
              label="Option B"
            />
            <XPRadio name="g" checked={false} disabled readOnly label="Disabled" />
          </Row>
        </Section>

        <Section data-testid="gallery-select">
          <Title>Combobox — XPSelect</Title>
          <Row>
            <XPSelect defaultValue="1024x768">
              <option>800x600</option>
              <option>1024x768</option>
              <option>1280x1024</option>
            </XPSelect>
            <XPSelect disabled defaultValue="Disabled">
              <option>Disabled</option>
            </XPSelect>
          </Row>
        </Section>

        <Section data-testid="gallery-slider">
          <Title>Trackbar — xpTrackbarStyles</Title>
          <Row>
            <Slider
              type="range"
              min={0}
              max={100}
              value={slider}
              onChange={e => setSlider(Number(e.target.value))}
            />
            <span>{slider}%</span>
          </Row>
        </Section>

        <Section data-testid="gallery-progress">
          <Title>Progress bar — XPProgressBar</Title>
          <Row>
            <div style={{ width: 200 }}>
              <XPProgressBar value={0} />
            </div>
            <div style={{ width: 200 }}>
              <XPProgressBar value={40} />
            </div>
          </Row>
          <Row>
            <div style={{ width: 200 }}>
              <XPProgressBar value={100} />
            </div>
          </Row>
        </Section>

        <Section data-testid="gallery-tooltip">
          <Title>Tooltip — XPTooltip ({COLORS.TOOLTIP_BG})</Title>
          <Row>
            <TooltipSwatch>This is a Windows XP tooltip</TooltipSwatch>
            <XPTooltip text="Hover tooltip works too">
              <XPButton>Hover me</XPButton>
            </XPTooltip>
          </Row>
        </Section>

        <Section data-testid="gallery-balloon">
          <Title>Tray balloon — BalloonTip</Title>
          <Row style={{ paddingBottom: 12 }}>
            <BalloonTip
              icon="360safe"
              title="360 Safe Guard Alert"
              body="Your computer is protected"
              onClose={() => undefined}
            />
            <BalloonTip
              icon="network"
              title="Local Area Connection"
              body="Speed: 100.0 Mbps"
              showTail={false}
            />
          </Row>
        </Section>

        <Section data-testid="gallery-menubar">
          <Title>Menu bar — XPMenuBar</Title>
          <XPMenuBar>
            <XPMenuBarItem>File</XPMenuBarItem>
            <XPMenuBarItem $active>Edit</XPMenuBarItem>
            <XPMenuBarItem>View</XPMenuBarItem>
            <XPMenuBarItem>Help</XPMenuBarItem>
          </XPMenuBar>
        </Section>

        <Section data-testid="gallery-groupbox">
          <Title>Group box — XPGroupBox</Title>
          <XPGroupBox label="Options">
            <Row style={{ marginBottom: 0 }}>
              <XPCheckbox checked readOnly label="Enable feature" />
              <XPTextInput defaultValue="value" style={{ width: 120 }} />
            </Row>
          </XPGroupBox>
        </Section>

        <Section data-testid="gallery-tabs">
          <Title>Tabs — XPTabs</Title>
          <XPTabs
            defaultActiveId="general"
            tabs={[
              { id: 'general', label: 'General', content: 'General settings panel.' },
              { id: 'advanced', label: 'Advanced', content: 'Advanced settings panel.' },
              { id: 'about', label: 'About', content: 'About this program.' },
            ]}
          />
        </Section>

        <Section data-testid="gallery-dialog">
          <Title>Dialog — XPDialog (standalone, no providers)</Title>
          <XPDialog
            title="Notepad"
            icon="alert_warning"
            width={320}
            footer={
              <>
                <XPButton>Yes</XPButton>
                <XPButton>No</XPButton>
                <XPButton>Cancel</XPButton>
              </>
            }
          >
            The text in the Untitled file has changed.
            <br />
            Do you want to save the changes?
          </XPDialog>
        </Section>

        <Section data-testid="gallery-statusbar">
          <Title>Status bar — XPStatusBar</Title>
          <XPStatusBar>
            <XPStatusBarField>Ready</XPStatusBarField>
            <XPStatusBarField>Ln 1, Col 1</XPStatusBarField>
            <XPStatusBarField>100%</XPStatusBarField>
          </XPStatusBar>
        </Section>
      </Page>
    </div>
  );
};

export default Gallery;
