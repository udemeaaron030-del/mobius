import { NextResponse } from 'next/server';
import { cache } from '@/lib/cache/store';

// ═══════════════════════════════════════════════════
// MÖBIUS — Live Token Price
//
// Fetches the real-time USD price of the MÖBIUS token from Jupiter's
// public price API, keyed off the actual mint address in env config.
// Falls back to MOBIUS_USD_RATE only if the mint isn't set yet or the
// token has no on-chain liquidity to price against (e.g. pre-launch).
// ═══════════════════════════════════════════════════

export async function GET() {
  const mint = process.env.MOBIUS_TOKEN_MINT || '';
  const fallbackRate = parseFloat(process.env.MOBIUS_USD_RATE || '0.042');

  if (!mint) {
    return NextResponse.json({
      success: true,
      data: { price: fallbackRate, source: 'fallback', configured: false },
    });
  }

  const cacheKey = `token:price:${mint}`;
  const cached = cache.get<number>(cacheKey);
  if (cached != null) {
    return NextResponse.json({ success: true, data: { price: cached, source: 'jupiter', configured: true } });
  }

  try {
    const response = await fetch(`https://price.jup.ag/v6/price?ids=${mint}`, {
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      return NextResponse.json({
        success: true,
        data: { price: fallbackRate, source: 'fallback', configured: true, note: 'Price feed unavailable' },
      });
    }

    const data = await response.json();
    const price = data?.data?.[mint]?.price;

    if (typeof price === 'number' && price > 0) {
      cache.set(cacheKey, price, 30); // refresh every 30s
      return NextResponse.json({ success: true, data: { price, source: 'jupiter', configured: true } });
    }

    // Mint has no tracked price yet (e.g. no liquidity/pre-launch)
    return NextResponse.json({
      success: true,
      data: { price: fallbackRate, source: 'fallback', configured: true, note: 'No live price yet — token may be pre-launch' },
    });
  } catch (err) {
    return NextResponse.json({
      success: true,
      data: { price: fallbackRate, source: 'fallback', configured: true, note: 'Price feed request failed' },
    });
  }
}
