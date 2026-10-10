import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import { LoadingState } from '@/design/components';
import { useAdminSession } from './adminSession';
import { AdminShell } from './components/AdminShell';
import { AccessPage, SignInPage } from './pages/SignInPage';

const CandidatesPage = lazy(() => import('./pages/CandidatesPage'));
const CandidatePage = lazy(() => import('./pages/CandidatePage'));
const TeamPage = lazy(() => import('./pages/TeamPage'));

/**
 * The admin portal (/admin): Zycus staff invite candidates, follow tests live, review results and
 * act on a test (extend, message, force-submit, reopen). Staff sign in with Supabase Auth; every
 * action is checked by the database and audit-logged.
 */
export default function AdminRoute() {
  const status = useAdminSession((s) => s.status);
  const staff = useAdminSession((s) => s.staff);
  const init = useAdminSession((s) => s.init);

  useEffect(() => {
    void init();
  }, [init]);

  useEffect(() => {
    document.title = 'Admin · Zycus CodeArena';
  }, []);

  if (status === 'loading') return <LoadingState label="Opening the admin portal…" className="min-h-dvh" />;
  if (status === 'unavailable') return <AccessPage kind="unavailable" />;
  if (status === 'offline') return <AccessPage kind="offline" onRetry={() => void init()} />;
  if (status === 'not_staff') return <AccessPage kind="not_staff" />;
  if (status !== 'ready' || !staff) return <SignInPage />;

  return (
    <AdminShell>
      <Suspense fallback={<LoadingState />}>
        <Routes>
          <Route index element={<CandidatesPage />} />
          <Route path="candidates/:invitationId" element={<CandidatePage />} />
          <Route
            path="team"
            element={staff.role === 'super_admin' ? <TeamPage /> : <Navigate to="/admin" replace />}
          />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </Suspense>
    </AdminShell>
  );
}
