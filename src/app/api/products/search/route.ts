import { NextRequest, NextResponse } from 'next/server';
import { registry } from '@/lib/marketplace';
import { sanitizeInput, rateLimit } from '@/lib/security';
import type { SearchOptions } from '@/types';

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  if (!rateLimit(`search:${ip}`, 20, 60000)) {
    return NextResponse.json({ success: false, error: 'Rate limit exceeded' }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const query = sanitizeInput(searchParams.get('q') || '');
  const marketplace = searchParams.get('marketplace') || undefined;

  if (!query || query.length < 2) {
    return NextResponse.json({ success: false, error: 'Query must be at least 2 characters' }, { status: 400 });
  }

  const options: SearchOptions = {
    limit: Math.min(parseInt(searchParams.get('limit') || '10'), 50),
    offset: parseInt(searchParams.get('offset') || '0'),
    sortBy: (searchParams.get('sort') as SearchOptions['sortBy']) || undefined,
  };

  try {
    if (marketplace) {
      const products = await registry.searchByMarketplace(marketplace, query, options);
      const status = await registry.get(marketplace)?.getStatus();
      return NextResponse.json({ success: true, data: { products, total: products.length, marketplaces: { [marketplace]: status || 'unavailable' }, errors: [] } });
    }
    const result = await registry.searchAll(query, options);
    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    console.error('[API] Search error:', err);
    return NextResponse.json({ success: false, error: 'Search failed' }, { status: 500 });
  }
}
