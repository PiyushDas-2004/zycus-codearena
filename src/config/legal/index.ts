/**
 * Candidate-facing legal and HR texts — owned by Zycus Legal / HR.
 *
 * To change a text: edit the .md file AND bump its version below. Every candidate's consent
 * record stores the version and a SHA-256 of the exact text they saw, so past consents stay
 * provable after the wording changes (git history holds every version).
 */
import { appConfig } from '@/config/app.config';
import confidentialityMd from './confidentiality.md?raw';
import consentMd from './consent.md?raw';
import thankYouMd from './thank-you.md?raw';

export const legal = {
  /** Legal entity name shown as the data fiduciary. ⚠ To be confirmed by Zycus Legal. */
  dataFiduciary: 'Zycus',
  /** Shown when no grievance contact is configured in Admin → Settings. */
  defaultGrievanceContact: 'the Zycus Talent Acquisition contact in your invitation email',

  consent: { version: '2026-10-09.2', markdown: consentMd },
  confidentiality: { version: '2026-10-09.1', markdown: confidentialityMd },
  thankYou: { markdown: thankYouMd },
} as const;

export interface LegalVariables {
  grievanceContact: string;
  retentionDays: number;
  snapshotRetentionDays: number;
  snapshotMinutes: string;
}

/** Fills {{placeholders}}. Unknown placeholders are left visible so Legal notices them. */
export function renderLegal(markdown: string, vars: LegalVariables): string {
  const values: Record<string, string> = {
    dataFiduciary: legal.dataFiduciary,
    assessmentName: appConfig.assessmentName,
    grievanceContact: vars.grievanceContact,
    retentionDays: String(vars.retentionDays),
    snapshotRetentionDays: String(vars.snapshotRetentionDays),
    snapshotMinutes: String(vars.snapshotMinutes),
  };
  return markdown.replace(/\{\{(\w+)\}\}/g, (m, key: string) => values[key] ?? m);
}

/** The combined text the candidate accepts; its hash is stored with their consent. */
export function consentDocument(vars: LegalVariables): string {
  return `${renderLegal(legal.consent.markdown, vars)}\n\n---\n\n${renderLegal(legal.confidentiality.markdown, vars)}`;
}

export const consentVersion = () => `${legal.consent.version}+${legal.confidentiality.version}`.slice(0, 40);
