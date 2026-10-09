import { useEffect, useState } from 'react';
import { fetchProducts, type Product } from '../api/catalogue';

export function useProducts(query: string) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchProducts(query)
      .then((items) => {
        setProducts(items);
      })
      .catch((e: Error) => {
        setError(e.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return { products, loading, error };
}
