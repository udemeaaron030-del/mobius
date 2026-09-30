import crypto from 'crypto';

export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  return input.replace(/[<>"'&]/g, c => ({ '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '&': '&amp;' }[c] || c))
    .slice(0, 1000);
}

export function validatePrice(price: number): boolean {
  return typeof price === 'number' && price > 0 && price < 1000000 && isFinite(price);
}

export function generateQuoteId(): string {
  return `Q-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
}

export function generateOrderId(): string {
  return `ORD-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
}

export function hashQuote(quote: { id: string; totalMerchantCost: number; expiresAt: number; productId: string }): string {
  const secret = process.env.QUOTE_SIGNING_SECRET || 'mobius-dev-secret';
  return crypto.createHmac('sha256', secret)
    .update(`${quote.id}:${quote.totalMerchantCost}:${quote.expiresAt}:${quote.productId}`)
    .digest('hex');
}

export function verifyQuoteSignature(quote: { id: string; totalMerchantCost: number; expiresAt: number; productId: string; signature?: string }): boolean {
  if (!quote.signature) return false;
  return quote.signature === hashQuote(quote);
}

// Rate limiter
const rateLimits: Map<string, number[]> = new Map();
export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const hits = (rateLimits.get(key) || []).filter(t => now - t < windowMs);
  if (hits.length >= max) return false;
  hits.push(now);
  rateLimits.set(key, hits);
  return true;
}
