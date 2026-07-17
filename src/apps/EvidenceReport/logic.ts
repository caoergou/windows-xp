export type Confidence = 'proven' | 'probable' | 'unconfirmed' | 'refuted';
export type ClaimResult = 'supported' | 'under-supported' | 'conflicted' | 'unknown';

export interface ReportClaim {
  id: string;
  prompt: string;
  allowedConfidence?: Confidence[];
  minEvidence?: number;
  evidencePool?: string[];
  conflicts?: Array<{ evidenceId: string; message?: string }>;
  solution?: { confidence?: Confidence; evidenceIds?: string[] };
}

export interface ClaimSubmission {
  claimId: string;
  confidence: Confidence;
  evidenceIds: string[];
  note?: string;
}

export interface ReportSubmission {
  reportId: string;
  claims: ClaimSubmission[];
}

export const judgeClaim = (claim: ReportClaim, submitted: ClaimSubmission): ClaimResult => {
  if (claim.conflicts?.some(conflict => submitted.evidenceIds.includes(conflict.evidenceId))) {
    return 'conflicted';
  }
  if (!claim.solution) return 'unknown';
  if (claim.solution.confidence && submitted.confidence !== claim.solution.confidence)
    return 'unknown';
  const required = claim.solution.evidenceIds ?? [];
  const enough = submitted.evidenceIds.length >= (claim.minEvidence ?? 0);
  const includesRequired = required.every(id => submitted.evidenceIds.includes(id));
  return enough && includesRequired ? 'supported' : 'under-supported';
};

export const judgeReport = (
  claims: ReportClaim[],
  submission: ReportSubmission
): Record<string, ClaimResult> =>
  Object.fromEntries(
    submission.claims.map(item => {
      const claim = claims.find(candidate => candidate.id === item.claimId);
      return [item.claimId, claim ? judgeClaim(claim, item) : 'unknown'];
    })
  );
