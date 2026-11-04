import { useCallback, useReducer, useRef } from 'react';
import type { HttpClient } from '../api/httpClient';
import type { Approval, Decision } from '../types';

export type ApprovalsAction =
  | { type: 'LOADED'; items: Approval[] }
  | { type: 'SET_STATUS'; id: string; status: Approval['status'] }
  | { type: 'RESTORE'; items: Approval[] };

export function approvalsReducer(state: Approval[], action: ApprovalsAction): Approval[] {
  switch (action.type) {
    case 'LOADED':
      return action.items;
    case 'SET_STATUS':
      return state.map((a) => (a.id === action.id ? { ...a, status: action.status, error: undefined } : a));
    case 'RESTORE':
      return action.items;
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
      const snapshot = latest.current;
      dispatch({ type: 'SET_STATUS', id, status: decision });
      try {
        await api.post(`/approvals/${id}/${decision === 'APPROVED' ? 'approve' : 'reject'}`);
      } catch {
        dispatch({ type: 'RESTORE', items: snapshot });
      }
    },
    [api],
  );

  return { items, decide, load: (next: Approval[]) => dispatch({ type: 'LOADED', items: next }) };
}
