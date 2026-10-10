import { useEffect, useRef, useState } from 'react';
import type { HttpClient } from '../api/httpClient';
import type { Approval, Filter } from '../types';

/** Loads the approvals for the selected filter chip (All / Urgent / Mine). */
export function useApprovals(client: HttpClient, filter: Filter) {
  const [items, setItems] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const controller = useRef(new AbortController());

  useEffect(() => {
    setLoading(true);
    setError(null);
    client
      .get<Approval[]>(`/approvals?filter=${filter}`, { signal: controller.current.signal })
      .then((data) => {
        setItems(data);
        setLoading(false);
      })
      .catch((e: Error) => {
        if (e.name === 'AbortError') return;
        setError(e.message);
        setLoading(false);
      });
    return () => controller.current.abort();
  }, [client, filter]);

  return { items, loading, error };
}
