/**
 * Browser and device checks for the pre-test system check. Only desktop Google Chrome and
 * Microsoft Edge are supported (they implement every API the proctoring relies on).
 */

export interface BrowserInfo {
  name: 'chrome' | 'edge' | 'other';
  label: string;
  majorVersion: number | null;
  mobile: boolean;
  platform: string;
}

interface UAData {
  brands?: { brand: string; version: string }[];
  mobile?: boolean;
  platform?: string;
}

export const MIN_BROWSER_VERSION = 120;

export function detectBrowser(
  nav: Pick<Navigator, 'userAgent'> & { userAgentData?: UAData } = navigator,
): BrowserInfo {
  const ua = nav.userAgent;
  const data = nav.userAgentData;
  const brands = data?.brands ?? [];
  const brand = (name: string) => brands.find((b) => b.brand === name);
  const mobile = data?.mobile ?? /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
  const platform =
    data?.platform ||
    (/Windows/.test(ua) ? 'Windows' : /Mac OS X/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : 'Unknown');

  // Brave/Opera/Vivaldi also report "Chromium"; only the genuine brands count.
  const otherChromium =
    /OPR\/|Vivaldi|Brave|YaBrowser|SamsungBrowser/i.test(ua) ||
    brands.some((b) => /Brave|Opera|Vivaldi/i.test(b.brand));
  const edge = brand('Microsoft Edge');
  const chrome = brand('Google Chrome');
  if (!otherChromium && edge)
    return { name: 'edge', label: 'Microsoft Edge', majorVersion: Number(edge.version), mobile, platform };
  if (!otherChromium && chrome)
    return { name: 'chrome', label: 'Google Chrome', majorVersion: Number(chrome.version), mobile, platform };

  // Fallback for browsers without User-Agent Client Hints.
  const edgeUa = ua.match(/Edg\/(\d+)/);
  if (!otherChromium && edgeUa)
    return { name: 'edge', label: 'Microsoft Edge', majorVersion: Number(edgeUa[1]), mobile, platform };
  const chromeUa = ua.match(/Chrome\/(\d+)/);
  if (!otherChromium && chromeUa && !/Chromium|CriOS|FxiOS|Firefox/.test(ua)) {
    return { name: 'chrome', label: 'Google Chrome', majorVersion: Number(chromeUa[1]), mobile, platform };
  }
  const label = /Firefox\//.test(ua)
    ? 'Firefox'
    : /Safari\//.test(ua) && !/Chrome/.test(ua)
      ? 'Safari'
      : 'This browser';
  return { name: 'other', label, majorVersion: null, mobile, platform };
}

export function isSupportedBrowser(b: BrowserInfo): boolean {
  return (
    b.name !== 'other' &&
    !b.mobile &&
    (b.majorVersion ?? 0) >= MIN_BROWSER_VERSION &&
    !/Android|iOS/i.test(b.platform)
  );
}

/** `screen.isExtended` (Window Management API): true when the OS has more than one display. */
export function hasExtendedDisplay(): boolean | null {
  const s = window.screen as Screen & { isExtended?: boolean };
  return typeof s.isExtended === 'boolean' ? s.isExtended : null;
}

/** Snapshot of device facts sent with consent/start and shown to reviewers. */
export function describeDevice() {
  const b = detectBrowser();
  return {
    browser: b.label,
    browser_version: b.majorVersion,
    platform: b.platform,
    screen: {
      width: window.screen.width,
      height: window.screen.height,
      pixel_ratio: window.devicePixelRatio,
    },
    viewport: { width: window.innerWidth, height: window.innerHeight },
    extended_display: hasExtendedDisplay(),
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    cores: navigator.hardwareConcurrency ?? null,
  };
}
