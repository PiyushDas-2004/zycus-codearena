// Read-only: provided by the platform team. Works as documented.

export interface Product {
  id: string;
  name: string;
  /** Price in minor units (paise / cents). */
  priceMinor: number;
  currency: string;
  imageUrl: string;
}

const BASE_URL = 'https://catalogue.api.example.internal/v2';

/**
 * Searches the catalogue. An empty query returns the featured products.
 * Pass an AbortSignal to cancel an in-flight request; a cancelled request rejects with an
 * `AbortError` (error.name === 'AbortError').
 */
export async function fetchProducts(query: string, signal?: AbortSignal): Promise<Product[]> {
  const response = await fetch(`${BASE_URL}/products?q=${encodeURIComponent(query)}`, { signal });
  if (!response.ok) {
    throw new Error(`Catalogue request failed (${response.status})`);
  }
  return (await response.json()) as Product[];
}
