import { useCallback, useReducer, useRef } from 'react';
import type { HttpClient } from '../api/httpClient';
import type { Approval, Decision } from '../types';

export type ApprovalsAction =
  | { type: 'LOADED'; items: Approval[] }
  | { type: 'OPTIMISTIC'; id: string; status: Approval['status'] }
  | { type: 'CONFIRMED'; id: string }
  | { type: 'ROLLBACK'; id: string; status: Approval['status']; error: string };

export function approvalsReducer(state: Approval[], action: ApprovalsAction): Approval[] {
  switch (action.type) {
    case 'LOADED':
      return action.items;
    case 'OPTIMISTIC':
      return state.map((a) => (a.id === action.id ? { ...a, status: action.status, error: undefined } : a));
    case 'CONFIRMED':
      return state.map((a) => (a.id === action.id ? { ...a, error: undefined } : a));
    case 'ROLLBACK':
      return state.map((a) => (a.id === action.id ? { ...a, status: action.status, error: action.error } : a));
    default:
      return state;
  }
}

/**
 * Approve / reject with an optimistic update: the row changes immediately and is put back if the
 * server call fails. Approvers often action several rows in quick succession.
 */
export function useApprovalDecisions(api: Pick<HttpClient, 'post'>, initial: Approval[]) {
  const [items, dispatch] = useReducer(approvalsReducer, initial);
  const latest = useRef(items);
  latest.current = items;

  const decide = useCallback(
    async (id: string, decision: Decision) => {
      // FIX: remember only this row's previous status and roll back only this row, against the
      // current state. Restoring a whole-list snapshot undid other rows' (successful) decisions.
      const previous = latest.current.find((a) => a.id === id)?.status ?? 'PENDING';
      dispatch({ type: 'OPTIMISTIC', id, status: decision });
      try {
        await api.post(`/approvals/${id}/${decision === 'APPROVED' ? 'approve' : 'reject'}`);
        dispatch({ type: 'CONFIRMED', id });
      } catch (e) {
        dispatch({ type: 'ROLLBACK', id, status: previous, error: e instanceof Error ? e.message : 'Failed' });
      }
    },
    [api],
  );

  return { items, decide, load: (next: Approval[]) => dispatch({ type: 'LOADED', items: next }) };
}
