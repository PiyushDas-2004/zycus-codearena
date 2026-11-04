import { clsx } from 'clsx';
import { LogOut, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import { NavLink } from 'react-router';
import { AppFooter, Badge, Button, ProductLockup, SpectrumBar } from '@/design/components';
import { ROLE_LABEL, useAdminSession } from '../adminSession';

const navClass = ({ isActive }: { isActive: boolean }) =>
  clsx(
    'inline-flex h-9 items-center gap-2 rounded-pill px-4 text-sm font-medium transition-colors',
    isActive ? 'bg-primary-soft text-primary' : 'text-strong hover:bg-surface-sunken',
  );

export function AdminShell({ children }: { children: ReactNode }) {
  const staff = useAdminSession((s) => s.staff);
  const signOut = useAdminSession((s) => s.signOut);

  return (
    <div className="flex min-h-dvh flex-col bg-surface-app">
      <SpectrumBar />
      <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6">
          <NavLink to="/admin" className="shrink-0" aria-label="Admin home">
            <ProductLockup compact />
          </NavLink>
          <Badge tone="info" className="hidden sm:inline-flex">
            Admin
          </Badge>
          <nav aria-label="Admin" className="flex items-center gap-1">
            <NavLink to="/admin" end className={navClass}>
              Candidates
            </NavLink>
            {staff?.role === 'super_admin' && (
              <NavLink to="/admin/team" className={navClass}>
                <Users className="size-4" aria-hidden="true" />
                Team & settings
              </NavLink>
            )}
          </nav>
          <div className="ml-auto flex min-w-0 items-center gap-3">
            <div className="hidden min-w-0 text-right leading-tight md:block">
              <p className="truncate text-sm font-medium text-strong">{staff?.fullName || staff?.email}</p>
              <p className="text-xs text-muted">{staff ? ROLE_LABEL[staff.role] : ''}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              leadingIcon={<LogOut className="size-4" aria-hidden="true" />}
              onClick={() => void signOut()}
            >
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      <AppFooter />
    </div>
  );
}
