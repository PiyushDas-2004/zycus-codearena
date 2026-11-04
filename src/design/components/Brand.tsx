import { clsx } from 'clsx';
import { appConfig } from '@/config/app.config';

interface BrandLogoProps {
  /** Rendered height in px; width follows the logo's aspect ratio. */
  height?: number;
  className?: string;
}

export function BrandLogo({ height = 32, className }: BrandLogoProps) {
  const { width: w, height: h } = appConfig.brand.logoSize;
  return (
    <img
      src={appConfig.brand.logo}
      alt={appConfig.brand.logoAlt}
      width={Math.round((w / h) * height)}
      height={height}
      // Reversed (white) in dark mode via --logo-filter.
      className={clsx('block select-none [filter:var(--logo-filter)]', className)}
      draggable={false}
    />
  );
}

/** Logo + product name lockup used in headers. */
export function ProductLockup({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <BrandLogo height={compact ? 26 : 30} />
      <span className="h-6 w-px bg-border-strong" aria-hidden="true" />
      <div className="leading-tight">
        <p className="text-[15px] font-semibold text-strong">
          {appConfig.platformName.replace(/^Zycus\s+/, '')}
        </p>
        {!compact && <p className="text-xs text-muted">{appConfig.subtitle}</p>}
      </div>
    </div>
  );
}

export function SpectrumBar({ className }: { className?: string }) {
  return <div aria-hidden="true" className={clsx('bg-gradient-spectrum h-1 w-full', className)} />;
}

export function AppFooter({
  className,
  align = 'center',
}: {
  className?: string;
  align?: 'center' | 'left';
}) {
  return (
    <footer
      className={clsx(
        'py-5 text-xs text-muted',
        align === 'center' ? 'px-6 text-center' : 'text-left',
        className,
      )}
    >
      {appConfig.footerText(new Date().getFullYear())}
    </footer>
  );
}
