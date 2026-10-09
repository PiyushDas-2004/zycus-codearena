import { useMemo } from 'react';

/**
 * Tiled, faint identity watermark over the whole workspace (candidate email, session id, label),
 * so any photo or screen capture of the test is traceable. It never intercepts the mouse.
 */
export function Watermark({ lines, opacity }: { lines: string[]; opacity: number }) {
  const url = useMemo(() => {
    const esc = (s: string) => s.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`);
    const text = lines.map((l, i) => `<tspan x="0" dy="${i === 0 ? 0 : 20}">${esc(l)}</tspan>`).join('');
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="420" height="220">` +
      `<g transform="translate(40 150) rotate(-24)" fill="#7a8699" font-family="Inter, Segoe UI, sans-serif" font-size="14" font-weight="600">` +
      `<text>${text}</text></g></svg>`;
    return `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}")`;
  }, [lines]);

  return (
    <div
      aria-hidden="true"
      data-testid="watermark"
      className="pointer-events-none fixed inset-0 z-[60] select-none print:hidden"
      style={{ backgroundImage: url, opacity }}
    />
  );
}
