'use client';

import { useState, useCallback } from 'react';
import type { Product, SearchResult, MarketplaceInfo } from '@/types';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [marketplaceStatuses, setMarketplaceStatuses] = useState<Record<string, string>>({});

  const search = useCallback(async (query: string, marketplace?: string) => {
    if (!query || query.length < 2) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ q: query });
      if (marketplace && marketplace !== 'all') params.set('marketplace', marketplace);

      const response = await fetch(`/api/products/search?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setProducts(data.data.products);
        setMarketplaceStatuses(data.data.marketplaces);
      } else {
        setError(data.error || 'Search failed');
        setProducts([]);
      }
    } catch {
      setError('Failed to connect. Please try again.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const getMarketplaces = useCallback(async (): Promise<MarketplaceInfo[]> => {
    try {
      const response = await fetch('/api/marketplaces');
      const data = await response.json();
      return data.success ? data.data : [];
    } catch {
      return [];
    }
  }, []);

  return { products, loading, error, marketplaceStatuses, search, getMarketplaces };
}
