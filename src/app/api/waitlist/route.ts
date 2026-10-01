import { NextRequest, NextResponse } from 'next/server';
import { kvGet, kvSet, isKvConfigured } from '@/lib/kv';

const KEY = 'mobius:waitlist';

export async function POST(request: NextRequest) {
  if (!isKvConfigured()) return NextResponse.json({ success: false, error: 'Storage not configured yet' }, { status: 503 });
  try {
    const { email } = await request.json();
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, error: 'Enter a valid email address' }, { status: 400 });
    }
    const list = (await kvGet<string[]>(KEY)) || [];
    if (!list.includes(email)) {
      list.push(email);
      await kvSet(KEY, list);
    }
    return NextResponse.json({ success: true, message: "You're on the list." });
  } catch {
    return NextResponse.json({ success: false, error: 'Something went wrong' }, { status: 500 });
  }
}
