// MÖBIUS — In-memory cache with TTL
interface CacheEntry<T> { data: T; expiresAt: number; }

class MemoryCache {
  private store: Map<string, CacheEntry<any>> = new Map();
  private maxSize = 1000;

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) { this.store.delete(key); return null; }
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlSeconds: number): void {
    if (this.store.size >= this.maxSize) {
      const firstKey = this.store.keys().next().value;
      if (firstKey) this.store.delete(firstKey);
    }
    this.store.set(key, { data, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  delete(key: string): void { this.store.delete(key); }
  clear(): void { this.store.clear(); }
  get size(): number { return this.store.size; }
}

export const cache = new MemoryCache();
