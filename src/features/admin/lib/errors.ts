import type { AdminApi, AdminFailure } from '../api/types';

/** What to tell staff when an admin call fails. */
export function adminErrorMessage(f: Pick<AdminFailure, 'error' | 'message'>): string {
  switch (f.error) {
    case 'NOT_STAFF':
      return 'Your account doesn’t have access to the admin portal. Ask a Super Admin to add you.';
    case 'FORBIDDEN':
      return f.message ?? 'Your role doesn’t allow this.';
    case 'NOT_FOUND':
      return 'Not found. It may have been removed, or it isn’t assigned to you.';
    case 'INVALID_PAYLOAD':
      return f.message ?? 'Check the highlighted field.';
    case 'DUPLICATE_ACTIVE':
      return 'This person already has a working code for this assessment.';
    case 'TEMPLATE_INACTIVE':
      return 'This assessment is switched off.';
    case 'NOT_IN_PROGRESS':
      return 'The test isn’t in progress any more. The page now shows its current state.';
    case 'NOT_SUBMITTED':
      return 'The test isn’t submitted. The page now shows its current state.';
    case 'ALREADY_STARTED':
      return 'The candidate has already started the test, so this can’t be changed.';
    case 'ALREADY_FINISHED':
      return 'This test has already finished.';
    case 'NO_TIME_LEFT':
    case 'EXTENSION_LIMIT':
      return f.message ?? 'Not enough time is left for this.';
    case 'SIGNED_OUT':
      return 'Your session ended. Please sign in again.';
    case 'NETWORK':
      return 'Couldn’t reach the server. Check your connection and try again.';
    default:
      return f.message ?? 'Something went wrong. Please try again.';
  }
}

/**
 * Wraps an API so that any call finding the session gone (expired, or signed out in another tab)
 * reports it once, and the portal shows the sign-in page.
 */
export function withSessionGuard(api: AdminApi, onSignedOut: () => void): AdminApi {
  return new Proxy(api, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver) as unknown;
      if (typeof value !== 'function' || prop === 'restore' || prop === 'signIn') return value;
      return (...args: unknown[]) => {
        const out = (value as (...a: unknown[]) => unknown).apply(target, args);
        if (out instanceof Promise) {
          return out.then((r: unknown) => {
            if (r && typeof r === 'object' && (r as AdminFailure).ok === false) {
              const code = (r as AdminFailure).error;
              if (code === 'SIGNED_OUT' || code === 'NOT_STAFF') onSignedOut();
            }
            return r;
          });
        }
        return out;
      };
    },
  });
}
