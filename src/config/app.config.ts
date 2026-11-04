/**
 * Platform identity — the ONE place to rename the product or change its fixed wording.
 * Imported by the app and by vite.config.ts (which injects the name into index.html),
 * so keep this file free of browser-only APIs and path aliases.
 *
 * Legal/HR-owned candidate texts (consent, confidentiality, thank-you) live in src/config/legal/.
 */
const subtitle = 'Hands-On Coding Assessment';

export const appConfig = {
  platformName: 'Zycus Talent Assessment',
  subtitle,
  companyName: 'Zycus',
  /** Full name of the assessment, used in sentences (login welcome line, consent notice). */
  assessmentName: `Zycus ${subtitle}`,
  welcomeLine: `Welcome to the Zycus ${subtitle}`,
  footerText: (year: number) => `© ${year} Zycus · Internal Hiring Assessment · Confidential`,
  watermarkLabel: 'Zycus Confidential',

  brand: {
    logo: '/brand/zycus-logo.webp',
    logoAlt: 'Zycus',
    /** Intrinsic size of the logo file, used to reserve layout space. */
    logoSize: { width: 500, height: 99 },
    mark: '/brand/zycus-mark.webp',
    favicon: '/brand/zycus-favicon.webp',
    images: {
      login: '/brand/photo-team-collaboration.webp',
      admin: '/brand/photo-office-meeting.webp',
      instructions: '/brand/photo-workshop.webp',
      thankYou: '/brand/photo-team-hands.webp',
    },
  },

  candidate: {
    /** Supported browsers for the assessment (desktop only). */
    supportedBrowsers: ['Google Chrome', 'Microsoft Edge'] as const,
    minScreenWidthPx: 1280,
  },
} as const;

export type AppConfig = typeof appConfig;
