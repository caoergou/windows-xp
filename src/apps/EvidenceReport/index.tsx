import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import type { EvidenceItem } from '../EvidenceBoard';
import { useXPEventBus } from '../../context/EventBusContext';
import { useStorage } from '../../context/StorageContext';
import { resolveOSTheme } from '../../themes/useOSTheme';
import { XPButton } from '../../components/XPButton';
import { XPCheckbox } from '../../components/XPCheckbox';
import {
  judgeReport,
  type ClaimSubmission,
  type Confidence,
  type ReportClaim,
  type ReportSubmission,
} from './logic';
import { useOptionalFileSystem } from '../../context/FileSystemContext';
import { useOptionalWindowManager } from '../../context/WindowManagerContext';
import { APP_REGISTRY, resolveFileOpen } from '../../registry/apps';
import { useContentPacks } from '../../context/ContentPackContext';

export interface EvidenceReportProps {
  reportId?: string;
  title?: string;
  claims?: ReportClaim[];
  evidence?: EvidenceItem[];
  collectedEvidenceIds?: string[];
  revealSolution?: boolean;
}

const Wrap = styled.div`
  height: 100%;
  overflow: auto;
  padding: 12px;
  box-sizing: border-box;
  background: ${({ theme }) => resolveOSTheme(theme).tokens.SURFACE};
  color: ${({ theme }) => resolveOSTheme(theme).tokens.BLACK};
  font: 11px ${({ theme }) => resolveOSTheme(theme).fonts.UI};
`;
const Claim = styled.fieldset`
  margin: 0 0 10px;
  padding: 8px;
`;
const EvidenceList = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px;
  margin: 8px 0;
`;
const Note = styled.textarea`
  width: 100%;
  min-height: 42px;
  box-sizing: border-box;
  font: inherit;
`;
const Review = styled.div`
  margin-top: 6px;
  padding: 6px;
  border: 1px solid ${({ theme }) => resolveOSTheme(theme).tokens.BUTTON_SHADOW};
  background: ${({ theme }) => resolveOSTheme(theme).tokens.WHITE};
`;
const SourceButton = styled.button`
  margin: 4px 4px 0 0;
  font: inherit;
`;

const confidenceValues: Confidence[] = ['proven', 'probable', 'unconfirmed', 'refuted'];
type PersistedReport = {
  draft: Record<string, ClaimSubmission>;
  review: Record<string, ReturnType<typeof judgeReport>[string]> | null;
};

const EvidenceReport: React.FC<EvidenceReportProps> = ({
  reportId = 'report',
  title,
  claims: claimProps,
  evidence: evidenceProps,
  collectedEvidenceIds,
  revealSolution = false,
}) => {
  const { t } = useTranslation();
  const content = useContentPacks();
  const authored = content.reports.find(report => report.reportId === reportId);
  const claims = useMemo(
    () => claimProps ?? authored?.claims ?? [],
    [authored?.claims, claimProps]
  );
  const evidence = useMemo(
    () => evidenceProps ?? authored?.evidence ?? [],
    [authored?.evidence, evidenceProps]
  );
  const bus = useXPEventBus();
  const storage = useStorage();
  const fs = useOptionalFileSystem();
  const windowManager = useOptionalWindowManager();
  const key = storage.key('evidence_reports');
  const initial = useMemo<PersistedReport>(() => {
    try {
      const saved = storage.local.getItem(key);
      if (saved) {
        const reports = JSON.parse(saved) as Record<string, PersistedReport>;
        if (reports[reportId]) return reports[reportId];
      }
    } catch {
      // Ignore malformed draft state.
    }
    return { draft: {}, review: null };
  }, [key, reportId, storage]);
  const [draft, setDraft] = useState<Record<string, ClaimSubmission>>(initial.draft);
  const [review, setReview] = useState<Record<
    string,
    ReturnType<typeof judgeReport>[string]
  > | null>(initial.review);
  const visible = useMemo(
    () => new Set(collectedEvidenceIds ?? evidence.map(item => item.id)),
    [collectedEvidenceIds, evidence]
  );
  const byId = useMemo(() => new Map(evidence.map(item => [item.id, item])), [evidence]);

  const update = (claimId: string, patch: Partial<ClaimSubmission>) => {
    setDraft(previous => {
      const current = previous[claimId] ?? {
        claimId,
        confidence: 'unconfirmed' as const,
        evidenceIds: [],
      };
      const next = { ...previous, [claimId]: { ...current, ...patch } };
      let reports: Record<string, PersistedReport> = {};
      try {
        const raw = storage.local.getItem(key);
        if (raw) reports = JSON.parse(raw) as typeof reports;
      } catch {
        reports = {};
      }
      reports[reportId] = { draft: next, review };
      storage.local.setItem(key, JSON.stringify(reports));
      return next;
    });
  };

  const submit = () => {
    const submission: ReportSubmission = {
      reportId,
      claims: claims.map(
        claim =>
          draft[claim.id] ?? {
            claimId: claim.id,
            confidence: 'unconfirmed',
            evidenceIds: [],
          }
      ),
    };
    bus.emit({ type: 'deduction:report-submit', reportId, submission });
    const results = judgeReport(claims, submission);
    setReview(results);
    let reports: Record<string, PersistedReport> = {};
    try {
      const raw = storage.local.getItem(key);
      if (raw) reports = JSON.parse(raw) as typeof reports;
    } catch {
      reports = {};
    }
    reports[reportId] = { draft, review: results };
    storage.local.setItem(key, JSON.stringify(reports));
    Object.entries(results).forEach(([claimId, result]) => {
      bus.emit({ type: 'deduction:claim-result', reportId, claimId, result });
    });
  };

  const openEvidence = (item: EvidenceItem) => {
    if (item.sourcePath) {
      const node = fs?.getFile(item.sourcePath);
      const resolved = node
        ? resolveFileOpen(item.sourcePath[item.sourcePath.length - 1] ?? node.name, node)
        : null;
      if (resolved) {
        windowManager?.openWindow(
          resolved.appId,
          node?.name ?? item.label,
          resolved.component,
          resolved.icon,
          {
            ...resolved.windowProps,
            sourcePath: item.sourcePath,
          }
        );
      }
      return;
    }
    const target =
      item.app ??
      (item.sourceUrl ? { appId: 'InternetExplorer', props: { url: item.sourceUrl } } : undefined);
    if (!target) return;
    const app = APP_REGISTRY[target.appId];
    if (app)
      windowManager?.openWindow(
        app.id,
        app.name,
        app.restore(target.props ?? {}),
        app.icon,
        app.window
      );
  };

  return (
    <Wrap data-testid="evidence-report">
      <h2>{title ?? t('evidenceReport.title')}</h2>
      {claims.map(claim => {
        const value = draft[claim.id] ?? {
          claimId: claim.id,
          confidence: 'unconfirmed' as const,
          evidenceIds: [],
        };
        const pool = (claim.evidencePool ?? evidence.map(item => item.id)).filter(id =>
          visible.has(id)
        );
        return (
          <Claim key={claim.id}>
            <legend>{claim.prompt}</legend>
            <select
              aria-label={t('evidenceReport.confidence')}
              value={value.confidence}
              onChange={event => update(claim.id, { confidence: event.target.value as Confidence })}
            >
              {(claim.allowedConfidence ?? confidenceValues).map(confidence => (
                <option key={confidence} value={confidence}>
                  {t(`evidenceReport.confidences.${confidence}`)}
                </option>
              ))}
            </select>
            <EvidenceList>
              {pool.map(id => (
                <XPCheckbox
                  key={id}
                  checked={value.evidenceIds.includes(id)}
                  label={byId.get(id)?.label ?? id}
                  onChange={event =>
                    update(claim.id, {
                      evidenceIds: event.target.checked
                        ? [...value.evidenceIds, id]
                        : value.evidenceIds.filter(item => item !== id),
                    })
                  }
                />
              ))}
            </EvidenceList>
            <Note
              aria-label={t('evidenceReport.note')}
              value={value.note ?? ''}
              onChange={event => update(claim.id, { note: event.target.value })}
            />
            {review && (
              <Review data-testid={`claim-result-${claim.id}`}>
                {t(`evidenceReport.results.${review[claim.id] ?? 'unknown'}`)}
                {revealSolution && claim.solution?.evidenceIds?.length
                  ? ` — ${claim.solution.evidenceIds.map(id => byId.get(id)?.label ?? id).join(', ')}`
                  : ''}
                <div>
                  {value.evidenceIds.map(id => {
                    const item = byId.get(id);
                    return item ? (
                      <SourceButton key={id} onClick={() => openEvidence(item)}>
                        {item.label}
                      </SourceButton>
                    ) : null;
                  })}
                </div>
              </Review>
            )}
          </Claim>
        );
      })}
      <XPButton onClick={submit}>{t('evidenceReport.submit')}</XPButton>
    </Wrap>
  );
};

export default EvidenceReport;
