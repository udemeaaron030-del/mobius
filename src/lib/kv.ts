import { Redis } from '@upstash/redis';

function getRedis(): Redis | null {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

export async function kvGet<T>(key: string): Promise<T | null> {
  const redis = getRedis();
  if (!redis) { console.error('[KV] Not configured'); return null; }
  return (await redis.get<T>(key)) ?? null;
}

export async function kvSet(key: string, value: unknown): Promise<boolean> {
  const redis = getRedis();
  if (!redis) { console.error('[KV] Not configured'); return false; }
  await redis.set(key, value);
  return true;
}

export function isKvConfigured(): boolean {
  return !!(
    (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL) &&
    (process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN)
  );
}
