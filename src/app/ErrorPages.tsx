import { Compass, OctagonAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { isRouteErrorResponse, Link, useRouteError } from 'react-router';
import { AppFooter, Card, LoadingState, ProductLockup, SpectrumBar } from '@/design/components';

function CenteredShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SpectrumBar />
      <header className="border-b border-border bg-surface px-8 py-4">
        <ProductLockup />
      </header>
      <main className="flex flex-1 items-center justify-center px-6 py-16">{children}</main>
      <AppFooter />
    </div>
  );
}

export function NotFoundPage() {
  return (
    <CenteredShell>
      <Card padding="lg" className="max-w-md text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-surface-tint text-primary">
          <Compass className="size-6" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-semibold">Page not found</h1>
        <p className="mt-2 text-muted">
          Check the link in your invitation email, or go back to the sign-in page.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex h-10 items-center rounded-pill border-2 border-primary px-5 font-medium text-primary no-underline hover:bg-primary-soft hover:no-underline"
        >
          Go to sign-in
        </Link>
      </Card>
    </CenteredShell>
  );
}

export function RouteErrorPage() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : 'An unexpected error occurred while loading this page.';
  return (
    <CenteredShell>
      <Card padding="lg" className="max-w-md text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-danger-surface text-danger">
          <OctagonAlert className="size-6" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-muted">{message}</p>
        <p className="mt-2 text-sm text-muted">
          If you are taking an assessment, your work is saved on this device. Reload the page to continue.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 inline-flex h-10 items-center rounded-pill border-2 border-primary bg-primary px-5 font-medium text-on-primary hover:bg-primary-hover"
        >
          Reload page
        </button>
      </Card>
    </CenteredShell>
  );
}

/** Shown while the first route module loads. */
export function HydrateFallback() {
  return <LoadingState className="min-h-dvh" />;
}
