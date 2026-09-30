import { NextRequest, NextResponse } from 'next/server';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';

// ═══════════════════════════════════════════════════
// MÖBIUS — Admin: Set Launch Time
//
// Writes the launch timestamp to a small local file instead of the
// .env.local file, so it takes effect immediately for every request —
// no server restart needed. The countdown API (/api/token/launch-status)
// reads this file first, falling back to the MOBIUS_LAUNCH_TIMESTAMP
// env var if the file doesn't exist yet.
//
// Protected by a simple shared secret (ADMIN_SECRET in .env.local).
// If ADMIN_SECRET isn't set, this route refuses to run rather than
// leaving the launch switch open to anyone who finds the URL.
// ═══════════════════════════════════════════════════

const DATA_DIR = path.join(process.cwd(), '.data');
const CONFIG_FILE = path.join(DATA_DIR, 'launch-config.json');

function checkAuth(request: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  const provided = request.headers.get('x-admin-secret');
  return provided === secret;
}

export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized or ADMIN_SECRET not configured' }, { status: 401 });
  }

  if (!existsSync(CONFIG_FILE)) {
    return NextResponse.json({ success: true, data: { launchTimestamp: null } });
  }

  const config = JSON.parse(readFileSync(CONFIG_FILE, 'utf8'));
  return NextResponse.json({ success: true, data: config });
}

export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized or ADMIN_SECRET not configured' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const launchTimestamp = body.launchTimestamp || Date.now();

    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(CONFIG_FILE, JSON.stringify({ launchTimestamp }, null, 2));

    return NextResponse.json({ success: true, data: { launchTimestamp } });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to set launch time' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized or ADMIN_SECRET not configured' }, { status: 401 });
  }

  if (existsSync(CONFIG_FILE)) {
    writeFileSync(CONFIG_FILE, JSON.stringify({ launchTimestamp: null }, null, 2));
  }

  return NextResponse.json({ success: true });
}
