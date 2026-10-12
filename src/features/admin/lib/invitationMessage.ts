/**
 * The invitation email the recruiter sends from their own mailbox (Outlook): the platform doesn't send
 * email itself, so nothing goes out on its own and the message comes from a Zycus person.
 */
import { firstName, formatDateTime } from './format';

export interface InvitationDetails {
  candidateName: string;
  email: string;
  accessCode: string;
  assessmentName: string;
  durationMinutes: number;
  validFromMs: number;
  validUntilMs: number;
  /** The candidate sign-in page, e.g. https://zycus-talent-assessment.pages.dev/ */
  link: string;
  senderName: string;
}

export function invitationEmail(d: InvitationDetails): { subject: string; body: string } {
  const name = firstName(d.candidateName) || 'there';
  const opensLater = d.validFromMs > Date.now() + 60_000;
  const lines = [
    `Hi ${name},`,
    '',
    `Thank you for your interest in Zycus. As the next step, please take our hands-on coding assessment: ${d.assessmentName}.`,
    '',
    `Link: ${d.link}`,
    `Email: ${d.email}`,
    `Access code: ${d.accessCode}`,
    opensLater
      ? `You can start between ${formatDateTime(d.validFromMs)} and ${formatDateTime(d.validUntilMs)}.`
      : `Please start before ${formatDateTime(d.validUntilMs)}.`,
    `It takes ${d.durationMinutes} minutes, in one sitting. The timer starts when you press Start.`,
    '',
    'Before you start:',
    '- Use a laptop or desktop with the latest Google Chrome or Microsoft Edge, one screen, and a webcam.',
    '- Sit somewhere quiet. The assessment is proctored: webcam, full screen, no other apps or tabs.',
    '- Your code works once, only with this email address. Please don’t share it.',
    '',
    'If anything goes wrong, reply to this email.',
    '',
    'Best of luck!',
    d.senderName,
    'Zycus Talent Acquisition',
  ];
  return { subject: `Your Zycus coding assessment: ${d.assessmentName}`, body: lines.join('\n') };
}

const enc = (s: string) => encodeURIComponent(s).replace(/%0A/g, '%0D%0A');

/** Opens the default mail app (Outlook on Zycus laptops) with the message filled in. */
export function mailtoLink(to: string, subject: string, body: string): string {
  return `mailto:${encodeURIComponent(to)}?subject=${enc(subject)}&body=${enc(body)}`;
}

/** Opens a new message in Outlook on the web (Microsoft 365). */
export function outlookWebLink(to: string, subject: string, body: string): string {
  const q = new URLSearchParams({ to, subject, body });
  return `https://outlook.office.com/mail/deeplink/compose?${q.toString()}`;
}
