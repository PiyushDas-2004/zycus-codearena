/** Who is signed in to the admin portal. The database re-checks the role on every call. */
import { create } from 'zustand';
import { getAdminApi, type AdminApi, type AdminErrorCode, type Staff } from './api';
import { withSessionGuard } from './lib/errors';

type Status = 'loading' | 'signed_out' | 'not_staff' | 'ready' | 'unavailable' | 'offline';

interface AdminSession {
  status: Status;
  staff: Staff | null;
  api: AdminApi | null;
  init: () => Promise<void>;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ ok: true } | { ok: false; error: AdminErrorCode; message?: string }>;
  signOut: () => Promise<void>;
  /** An API call found the session gone (expired or signed out elsewhere). */
  expired: () => void;
}

let unsubscribe: (() => void) | null = null;

export const useAdminSession = create<AdminSession>((set, get) => ({
  status: 'loading',
  staff: null,
  api: null,

  async init() {
    const raw = getAdminApi();
    if (!raw) return set({ status: 'unavailable', api: null });
    const api = withSessionGuard(raw, () => get().expired());
    set({ api });
    unsubscribe?.();
    unsubscribe = api.onSignedOut(() => set({ status: 'signed_out', staff: null }));
    const r = await api.restore();
    if (r.ok) set({ status: r.staff ? 'ready' : 'signed_out', staff: r.staff });
    else set({ status: r.error === 'NOT_STAFF' ? 'not_staff' : 'offline', staff: null });
  },

  async signIn(email, password) {
    const api = get().api;
    if (!api) return { ok: false, error: 'UNKNOWN' };
    const r = await api.signIn(email, password);
    if (r.ok) {
      set({ status: 'ready', staff: r.staff });
      return { ok: true };
    }
    if (r.error === 'NOT_STAFF') set({ status: 'not_staff', staff: null });
    return { ok: false, error: r.error, message: r.message };
  },

  async signOut() {
    await get().api?.signOut();
    set({ status: 'signed_out', staff: null });
  },

  expired() {
    set({ status: 'signed_out', staff: null });
  },
}));

export const can = {
  invite: (s: Staff | null) => s?.role === 'super_admin' || s?.role === 'recruiter',
  act: (s: Staff | null) => s?.role === 'super_admin' || s?.role === 'recruiter',
  manageTeam: (s: Staff | null) => s?.role === 'super_admin',
};

export const ROLE_LABEL: Record<Staff['role'], string> = {
  super_admin: 'Super Admin',
  recruiter: 'Recruiter',
  reviewer: 'Reviewer',
};

/** The admin API, for components that render only once signed in. */
export function useAdminApi(): AdminApi {
  const api = useAdminSession((s) => s.api);
  if (!api) throw new Error('The admin API is used before sign-in');
  return api;
}
