import { sanitizeInput, validatePrice, hashQuote, verifyQuoteSignature, rateLimit } from '@/lib/security';

describe('Security', () => {
  test('sanitizes XSS input', () => {
    expect(sanitizeInput('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(sanitizeInput('"onload=alert(1)')).toBe('&quot;onload=alert(1)');
  });

  test('truncates long input', () => {
    const long = 'a'.repeat(2000);
    expect(sanitizeInput(long).length).toBe(1000);
  });

  test('validates prices', () => {
    expect(validatePrice(99.99)).toBe(true);
    expect(validatePrice(0)).toBe(false);
    expect(validatePrice(-1)).toBe(false);
    expect(validatePrice(Infinity)).toBe(false);
    expect(validatePrice(NaN)).toBe(false);
    expect(validatePrice(2000000)).toBe(false);
  });

  test('quote signatures verify correctly', () => {
    const quote = { id: 'Q-TEST', totalMerchantCost: 100, expiresAt: Date.now() + 300000, productId: 'amz-001' };
    const signed = { ...quote, signature: hashQuote(quote) };
    expect(verifyQuoteSignature(signed)).toBe(true);
  });

  test('tampered quote fails verification', () => {
    const quote = { id: 'Q-TEST', totalMerchantCost: 100, expiresAt: Date.now() + 300000, productId: 'amz-001' };
    const tampered = { ...quote, totalMerchantCost: 50, signature: hashQuote(quote) };
    expect(verifyQuoteSignature(tampered)).toBe(false);
  });

  test('rate limiter blocks excess requests', () => {
    const key = `test-${Date.now()}`;
    expect(rateLimit(key, 3, 60000)).toBe(true);
    expect(rateLimit(key, 3, 60000)).toBe(true);
    expect(rateLimit(key, 3, 60000)).toBe(true);
    expect(rateLimit(key, 3, 60000)).toBe(false); // blocked
  });
});
