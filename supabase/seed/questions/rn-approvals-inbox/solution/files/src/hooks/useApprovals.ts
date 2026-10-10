import { useEffect, useState } from 'react';
import type { HttpClient } from '../api/httpClient';
import type { Approval, Filter } from '../types';

/** Loads the approvals for the selected filter chip (All / Urgent / Mine). */
export function useApprovals(client: HttpClient, filter: Filter) {
  const [items, setItems] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // FIX: a new controller per request. An AbortController can only abort once: reusing the one
    // aborted by the previous cleanup made every later request fail instantly (silently swallowed).
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    client
      .get<Approval[]>(`/approvals?filter=${filter}`, { signal: controller.signal })
      .then((data) => {
        if (controller.signal.aborted) return; // a newer filter is selected
        setItems(data);
        setLoading(false);
      })
      .catch((e: Error) => {
        if (controller.signal.aborted || e.name === 'AbortError') return;
        setError(e.message);
        setLoading(false);
      });
    return () => controller.abort();
  }, [client, filter]);

  return { items, loading, error };
}
