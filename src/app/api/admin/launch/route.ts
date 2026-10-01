import { NextRequest, NextResponse } from 'next/server';
import { kvGet, kvSet, isKvConfigured } from '@/lib/kv';

const KEY = 'mobius:launch-config';

function checkAuth(request: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  return request.headers.get('x-admin-secret') === secret;
}

export async function GET(request: NextRequest) {
  if (!checkAuth(request)) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  if (!isKvConfigured()) return NextResponse.json({ success: false, error: 'Storage not configured' }, { status: 503 });
  const config = await kvGet<{ launchTimestamp: number | null }>(KEY);
  return NextResponse.json({ success: true, data: config || { launchTimestamp: null } });
}

export async function POST(request: NextRequest) {
  if (!checkAuth(request)) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  if (!isKvConfigured()) return NextResponse.json({ success: false, error: 'Storage not configured' }, { status: 503 });
  const body = await request.json().catch(() => ({}));
  const launchTimestamp = body.launchTimestamp || Date.now();
  const ok = await kvSet(KEY, { launchTimestamp });
  if (!ok) return NextResponse.json({ success: false, error: 'Failed to write' }, { status: 500 });
  return NextResponse.json({ success: true, data: { launchTimestamp } });
}

export async function DELETE(request: NextRequest) {
  if (!checkAuth(request)) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  if (!isKvConfigured()) return NextResponse.json({ success: false, error: 'Storage not configured' }, { status: 503 });
  await kvSet(KEY, { launchTimestamp: null });
  return NextResponse.json({ success: true });
}
