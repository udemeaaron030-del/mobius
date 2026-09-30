import { AliExpressProvider } from '@/lib/marketplace/providers/aliexpress';

describe('Marketplace Providers', () => {
  describe('AliExpressProvider', () => {
    const provider = new AliExpressProvider();

    test('returns configuration_required without credentials', async () => {
      const status = await provider.getStatus();
      expect(status).toBe('configuration_required');
    });

    test('returns empty products without credentials', async () => {
      const products = await provider.searchProducts('test');
      expect(products).toEqual([]);
    });

    test('is presented generically, not by upstream supplier name', () => {
      expect(provider.id).toBe('marketplace');
      expect(provider.name).toBe('Marketplace');
    });
  });
});
