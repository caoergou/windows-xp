import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { usePrintSpooler, type PrintJob } from '../context/PrintSpoolerContext';
import XPIcon from '../components/XPIcon';
import { XPButton } from '../components/XPButton';
import { resolveOSTheme } from '../themes/useOSTheme';

const Shell = styled.div`
  height: 100%;
  display: grid;
  grid-template-columns: 180px 1fr;
  background: ${({ theme }) => resolveOSTheme(theme).tokens.WHITE};
  color: ${({ theme }) => resolveOSTheme(theme).tokens.BLACK};
  font: 11px ${({ theme }) => resolveOSTheme(theme).fonts.UI};
`;
const Printers = styled.div`
  padding: 8px;
  border-right: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.DIVIDER_GREY};
`;
const Printer = styled.button<{ $active: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px;
  border: 0;
  background: ${({ $active, theme }) =>
    $active ? resolveOSTheme(theme).tokens.MENU_HIGHLIGHT : 'transparent'};
  color: ${({ $active, theme }) =>
    $active ? resolveOSTheme(theme).tokens.WHITE : resolveOSTheme(theme).tokens.BLACK};
  font: inherit;
  text-align: left;
`;
const Queue = styled.div`
  min-width: 0;
  overflow: auto;
`;
const Header = styled.button`
  border: 0;
  border-right: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.DIVIDER_GREY};
  background: ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_GRADIENT};
  font: inherit;
  text-align: left;
`;
const Grid = styled.div`
  display: grid;
  grid-template-columns: minmax(130px, 2fr) 90px 90px 45px 70px 145px;
`;
const JobRow = styled(Grid)`
  padding: 3px 0;
  border-bottom: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.SURFACE};

  > span {
    padding: 0 5px;
  }
`;
const Details = styled.div`
  margin: 8px;
  padding: 8px;
  border: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_SHADOW};
  background: ${({ theme }) => resolveOSTheme(theme).tokens.SURFACE};

  p {
    margin: 3px 0;
  }
`;
const Actions = styled.div`
  display: flex;
  gap: 6px;
  margin-top: 8px;
`;

type SortKey = 'documentName' | 'submittedAt';

const PrintersAndFaxes: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { printers, jobs, updateJob, removeJob, openQueue, openJob } = usePrintSpooler();
  const [printerId, setPrinterId] = useState(printers[0]?.id ?? '');
  const [selected, setSelected] = useState<PrintJob | null>(null);
  const [sort, setSort] = useState<SortKey>('submittedAt');
  const queue = useMemo(
    () =>
      jobs
        .filter(job => job.printerId === printerId)
        .sort((a, b) =>
          sort === 'submittedAt'
            ? Date.parse(b.submittedAt) - Date.parse(a.submittedAt)
            : a.documentName.localeCompare(b.documentName)
        ),
    [jobs, printerId, sort]
  );
  return (
    <Shell>
      <Printers>
        {printers.map(printer => (
          <Printer
            key={printer.id}
            $active={printer.id === printerId}
            onDoubleClick={() => openQueue(printer.id)}
            onClick={() => {
              setPrinterId(printer.id);
              setSelected(null);
              openQueue(printer.id);
            }}
          >
            <XPIcon name="printer" size={24} />
            <span>{printer.name}</span>
          </Printer>
        ))}
      </Printers>
      <Queue>
        <Grid>
          <Header onClick={() => setSort('documentName')}>{t('print.document')}</Header>
          <Header>{t('print.status')}</Header>
          <Header>{t('print.owner')}</Header>
          <Header>{t('print.pages')}</Header>
          <Header>{t('print.size')}</Header>
          <Header onClick={() => setSort('submittedAt')}>{t('print.submitted')}</Header>
        </Grid>
        {queue.map(job => (
          <JobRow
            key={job.id}
            role="button"
            tabIndex={0}
            onClick={() => {
              setSelected(job);
              openJob(job.id);
            }}
          >
            <span>{job.documentName}</span>
            <span>{t(`print.statuses.${job.status}`)}</span>
            <span>{job.owner ?? ''}</span>
            <span>{job.pages ?? ''}</span>
            <span>{job.sizeBytes ?? ''}</span>
            <span>{new Date(job.submittedAt).toLocaleString(i18n.language)}</span>
          </JobRow>
        ))}
        {selected && (
          <Details>
            <p>{selected.sourcePath?.join('\\') ?? t('print.noSource')}</p>
            <p>{selected.spoolFileName ?? t('print.noSpoolFile')}</p>
            {selected.note && <p>{selected.note}</p>}
            <Actions>
              <XPButton
                disabled={selected.readOnly}
                onClick={() => updateJob(selected.id, { status: 'paused' })}
              >
                {t('print.pause')}
              </XPButton>
              <XPButton
                disabled={selected.readOnly}
                onClick={() => updateJob(selected.id, { status: 'queued' })}
              >
                {t('print.resume')}
              </XPButton>
              <XPButton disabled={selected.readOnly} onClick={() => removeJob(selected.id)}>
                {t('print.cancel')}
              </XPButton>
            </Actions>
          </Details>
        )}
      </Queue>
    </Shell>
  );
};

export default PrintersAndFaxes;
