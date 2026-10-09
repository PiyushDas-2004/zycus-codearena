import { LayoutDashboard } from 'lucide-react';
import { AppFooter, Card, EmptyState, ProductLockup, SpectrumBar } from '@/design/components';

/** Phase 1 placeholder. The admin portal (roles, health check, monitor, results) arrives in Phase 4. */
export default function AdminRoute() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SpectrumBar />
      <header className="border-b border-border bg-surface px-8 py-4">
        <ProductLockup />
      </header>
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <Card className="w-full max-w-lg">
          <EmptyState
            icon={<LayoutDashboard className="size-6" aria-hidden="true" />}
            title="Admin portal"
            description="Zycus staff sign-in, the question bank, live monitoring and results are built in Phase 4."
          />
        </Card>
      </main>
      <AppFooter />
    </div>
  );
}
