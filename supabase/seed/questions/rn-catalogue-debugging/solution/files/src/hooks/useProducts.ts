import { useEffect, useState } from 'react';
import { fetchProducts, type Product } from '../api/catalogue';

export function useProducts(query: string) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetchProducts(query, controller.signal)
      .then((items) => {
        setProducts(items);
      })
      .catch((e: Error) => {
        if (e.name === 'AbortError') return; // superseded by a newer query
        setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [query]);

  return { products, loading, error };
}
