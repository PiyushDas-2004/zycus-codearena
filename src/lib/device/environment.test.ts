import { describe, expect, it } from 'vitest';
import { detectBrowser, isSupportedBrowser } from './environment';

const WIN_CHROME =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';
const WIN_EDGE = `${WIN_CHROME} Edg/141.0.0.0`;

describe('detectBrowser', () => {
  it('recognises desktop Chrome and Edge via client hints', () => {
    const chrome = detectBrowser({
      userAgent: WIN_CHROME,
      userAgentData: {
        brands: [
          { brand: 'Chromium', version: '141' },
          { brand: 'Google Chrome', version: '141' },
        ],
        mobile: false,
        platform: 'Windows',
      },
    });
    expect(chrome).toMatchObject({ name: 'chrome', majorVersion: 141 });
    expect(isSupportedBrowser(chrome)).toBe(true);
    const edge = detectBrowser({
      userAgent: WIN_EDGE,
      userAgentData: {
        brands: [
          { brand: 'Chromium', version: '141' },
          { brand: 'Microsoft Edge', version: '141' },
        ],
        mobile: false,
        platform: 'Windows',
      },
    });
    expect(edge.name).toBe('edge');
    expect(isSupportedBrowser(edge)).toBe(true);
  });

  it('falls back to the user-agent string', () => {
    expect(detectBrowser({ userAgent: WIN_EDGE }).name).toBe('edge');
    expect(detectBrowser({ userAgent: WIN_CHROME }).name).toBe('chrome');
  });

  it('rejects mobile, other Chromium brands, Firefox, Safari and old versions', () => {
    const android = detectBrowser({
      userAgent:
        'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Mobile Safari/537.36',
      userAgentData: {
        brands: [{ brand: 'Google Chrome', version: '141' }],
        mobile: true,
        platform: 'Android',
      },
    });
    expect(isSupportedBrowser(android)).toBe(false);
    expect(detectBrowser({ userAgent: `${WIN_CHROME} OPR/115.0.0.0` }).name).toBe('other');
    expect(
      detectBrowser({
        userAgent: WIN_CHROME,
        userAgentData: { brands: [{ brand: 'Brave', version: '141' }], mobile: false },
      }).name,
    ).toBe('other');
    expect(
      detectBrowser({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; rv:131.0) Gecko/20100101 Firefox/131.0' })
        .label,
    ).toBe('Firefox');
    expect(isSupportedBrowser(detectBrowser({ userAgent: WIN_CHROME.replace('141.0', '109.0') }))).toBe(
      false,
    );
  });
});
