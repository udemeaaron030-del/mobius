import { NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import path from 'path';

// ═══════════════════════════════════════════════════
// MÖBIUS — Post-Launch Buying Lock
//
// After the token launches, buying is disabled for a fixed window so
// the market can find a stable price and creator fees can be properly
// accounted for and allocated toward delivery coverage.
//
// Reads the launch timestamp from /admin (which writes to a local file
// for instant effect), falling back to MOBIUS_LAUNCH_TIMESTAMP in env
// if that file doesn't exist. Leave both unset before launch — buying
// stays correctly enabled with no fake countdown to nowhere.
// ═══════════════════════════════════════════════════

const LOCK_HOURS = parseFloat(process.env.MOBIUS_BUY_LOCK_HOURS || '3');
const CONFIG_FILE = path.join(process.cwd(), '.data', 'launch-config.json');

function getLaunchTimestamp(): number | null {
  if (existsSync(CONFIG_FILE)) {
    try {
      const config = JSON.parse(readFileSync(CONFIG_FILE, 'utf8'));
      if (config.launchTimestamp) return config.launchTimestamp;
    } catch {}
  }
  return process.env.MOBIUS_LAUNCH_TIMESTAMP ? parseInt(process.env.MOBIUS_LAUNCH_TIMESTAMP, 10) : null;
}

export async function GET() {
  const launchTimestamp = getLaunchTimestamp();

  if (!launchTimestamp) {
    return NextResponse.json({
      success: true,
      data: { launched: false, enabled: false, buyingEnabledAt: null },
    });
  }

  const buyingEnabledAt = launchTimestamp + LOCK_HOURS * 3600 * 1000;
  const enabled = Date.now() >= buyingEnabledAt;

  return NextResponse.json({
    success: true,
    data: { launched: true, enabled, buyingEnabledAt, lockHours: LOCK_HOURS },
  });
}
