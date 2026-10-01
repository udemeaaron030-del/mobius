import { NextResponse } from 'next/server';
import { kvGet } from '@/lib/kv';

const LOCK_HOURS = parseFloat(process.env.MOBIUS_BUY_LOCK_HOURS || '3');
const KEY = 'mobius:launch-config';

async function getLaunchTimestamp(): Promise<number | null> {
  const config = await kvGet<{ launchTimestamp: number | null }>(KEY);
  if (config?.launchTimestamp) return config.launchTimestamp;
  return process.env.MOBIUS_LAUNCH_TIMESTAMP ? parseInt(process.env.MOBIUS_LAUNCH_TIMESTAMP, 10) : null;
}

export async function GET() {
  const launchTimestamp = await getLaunchTimestamp();
  if (!launchTimestamp) {
    return NextResponse.json({ success: true, data: { launched: false, enabled: false, buyingEnabledAt: null } });
  }
  const buyingEnabledAt = launchTimestamp + LOCK_HOURS * 3600 * 1000;
  const enabled = Date.now() >= buyingEnabledAt;
  return NextResponse.json({ success: true, data: { launched: true, enabled, buyingEnabledAt, lockHours: LOCK_HOURS } });
}
