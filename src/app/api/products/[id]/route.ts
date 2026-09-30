import { NextRequest, NextResponse } from 'next/server';
import { registry } from '@/lib/marketplace';
import { sanitizeInput, rateLimit } from '@/lib/security';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  if (!rateLimit(`product:${ip}`, 30, 60000)) {
    return NextResponse.json({ success: false, error: 'Rate limit exceeded' }, { status: 429 });
  }
  const productId = sanitizeInput(id);
  const marketplace = productId.split('-')[0];
  const provider = registry.get(marketplace);
  if (!provider) return NextResponse.json({ success: false, error: 'Marketplace not found' }, { status: 404 });
  try {
    const product = await provider.getProduct(productId);
    if (!product) return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: product });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch product' }, { status: 500 });
  }
}
