import type { MarketplaceProvider, MarketplaceInfo, SearchResult, SearchOptions, Product } from '@/types';

// ═══════════════════════════════════════════════════
// MÖBIUS — Marketplace Provider Registry
// ═══════════════════════════════════════════════════

class MarketplaceRegistry {
  private providers: Map<string, MarketplaceProvider> = new Map();

  register(provider: MarketplaceProvider): void {
    this.providers.set(provider.id, provider);
  }

  get(id: string): MarketplaceProvider | undefined {
    return this.providers.get(id);
  }

  getAll(): MarketplaceProvider[] {
    return Array.from(this.providers.values());
  }

  async getStatuses(): Promise<MarketplaceInfo[]> {
    const statuses = await Promise.all(
      this.getAll().map(async (provider) => {
        try {
          const status = await provider.getStatus();
          return {
            id: provider.id,
            name: provider.name,
            color: provider.color,
            status,
          };
        } catch {
          return {
            id: provider.id,
            name: provider.name,
            color: provider.color,
            status: 'error' as const,
            message: 'Failed to check status',
          };
        }
      })
    );
    return statuses;
  }

  async searchAll(query: string, options?: SearchOptions): Promise<SearchResult> {
    const results: Product[] = [];
    const marketplaceStatuses: Record<string, string> = {};
    const errors: Array<{ marketplace: string; error: string }> = [];

    // Query all providers in parallel with individual timeouts
    const TIMEOUT_MS = 8000;

    const promises = this.getAll().map(async (provider) => {
      let timeoutHandle: ReturnType<typeof setTimeout>;

      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutHandle = setTimeout(() => reject(new Error('Request timeout')), TIMEOUT_MS);
      });
      // Prevent an unhandled rejection warning if this timer fires after
      // the race has already settled via the other branch.
      timeoutPromise.catch(() => {});

      try {
        const status = await provider.getStatus();
        if (status !== 'connected') {
          marketplaceStatuses[provider.id] = status;
          clearTimeout(timeoutHandle!);
          return;
        }

        const products = await Promise.race([
          provider.searchProducts(query, options),
          timeoutPromise,
        ]);

        clearTimeout(timeoutHandle!);
        results.push(...products);
        marketplaceStatuses[provider.id] = 'connected';
      } catch (err) {
        clearTimeout(timeoutHandle!);
        const message = err instanceof Error ? err.message : 'Unknown error';
        errors.push({ marketplace: provider.id, error: message });
        marketplaceStatuses[provider.id] = 'error';
      }
    });

    await Promise.allSettled(promises);

    // Deduplicate by title similarity (basic)
    const seen = new Set<string>();
    const deduped = results.filter((product) => {
      const key = product.title.toLowerCase().trim().slice(0, 60);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Sort by relevance (products with images first, then by price)
    deduped.sort((a, b) => {
      if (a.images.length && !b.images.length) return -1;
      if (!a.images.length && b.images.length) return 1;
      return a.price.amount - b.price.amount;
    });

    return {
      products: deduped,
      total: deduped.length,
      marketplaces: marketplaceStatuses as Record<string, any>,
      errors,
    };
  }

  async searchByMarketplace(
    marketplaceId: string,
    query: string,
    options?: SearchOptions
  ): Promise<Product[]> {
    const provider = this.get(marketplaceId);
    if (!provider) return [];

    const status = await provider.getStatus();
    if (status !== 'connected') return [];

    return provider.searchProducts(query, options);
  }
}

// Singleton registry
export const registry = new MarketplaceRegistry();
