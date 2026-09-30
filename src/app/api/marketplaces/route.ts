import { NextResponse } from 'next/server';
import { registry } from '@/lib/marketplace';

export async function GET() {
  const statuses = await registry.getStatuses();
  return NextResponse.json({ success: true, data: statuses });
}
