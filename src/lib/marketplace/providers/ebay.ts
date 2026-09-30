import type { MarketplaceProvider, Product, SearchOptions, MarketplaceStatus, Availability, Price, ShippingInfo } from '@/types';
import { cache } from '@/lib/cache/store';

// ═══════════════════════════════════════════════════
// MÖBIUS — eBay Browse API
// Docs: https://developer.ebay.com/api-docs/buy/browse/overview.html
//
// Standard OAuth2 client-credentials flow — no custom request signing,
// unlike some other marketplace APIs. This is the primary active provider.
//
// UI NOTE: presented to end users generically as "Marketplace" — the
// underlying supplier is an implementation detail, not a user-facing claim.
// ═══════════════════════════════════════════════════

const EBAY_API_BASE = 'https://api.ebay.com';

function getConfig() {
  return {
    clientId: process.env.EBAY_CLIENT_ID || '',
    clientSecret: process.env.EBAY_CLIENT_SECRET || '',
  };
}

function isConfigured(): boolean {
  const c = getConfig();
  return !!(c.clientId && c.clientSecret);
}

async function getAccessToken(): Promise<string | null> {
  const cached = cache.get<string>('ebay:access_token');
  if (cached) return cached;

  const config = getConfig();
  const credentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');

  try {
    const response = await fetch(`${EBAY_API_BASE}/identity/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${credentials}`,
      },
      body: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope',
    });

    if (!response.ok) {
      console.error(`[Marketplace] Token error ${response.status}:`, await response.text());
      return null;
    }

    const data = await response.json();
    const token = data.access_token;
    const expiresIn = data.expires_in || 7200;

    cache.set('ebay:access_token', token, expiresIn - 300); // refresh 5 min early
    return token;
  } catch (err) {
    console.error('[Marketplace] Token request failed:', err);
    return null;
  }
}

function normalizeProduct(item: any): Product {
  const price = item.price?.value ? parseFloat(item.price.value) : 0;
  const shippingCost = item.shippingOptions?.[0]?.shippingCost?.value
    ? parseFloat(item.shippingOptions[0].shippingCost.value)
    : undefined;

  return {
    id: `mkt-${item.itemId}`,
    marketplace: 'marketplace',
    marketplaceProductId: item.itemId,
    merchant: undefined,
    title: item.title || 'Product',
    description: item.shortDescription || undefined,
    images: [
      item.image?.imageUrl,
      item.thumbnailImages?.[0]?.imageUrl,
      ...(item.additionalImages?.map((img: any) => img.imageUrl) || []),
    ].filter(Boolean),
    price: {
      amount: price,
      currency: item.price?.currency || 'USD',
    },
    availability: {
      available: item.estimatedAvailabilities?.[0]?.estimatedAvailabilityStatus === 'IN_STOCK' || true,
      quantity: undefined,
    },
    shipping: {
      available: true,
      cost: shippingCost,
      currency: item.shippingOptions?.[0]?.shippingCost?.currency || 'USD',
      estimatedDelivery: item.shippingOptions?.[0]?.maxEstimatedDeliveryDate
        ? `By ${new Date(item.shippingOptions[0].maxEstimatedDeliveryDate).toLocaleDateString()}`
        : undefined,
    },
    productUrl: item.itemWebUrl || '',
    category: item.categories?.[0]?.categoryName || undefined,
    checkout: { supported: true, mode: 'merchant_redirect' },
  };
}

export class EbayProvider implements MarketplaceProvider {
  id = 'marketplace';
  name = 'Marketplace';
  color = '#4c60f1';

  async getStatus(): Promise<MarketplaceStatus> {
    if (!isConfigured()) return 'configuration_required';
    const token = await getAccessToken();
    if (!token) return 'error';
    return 'connected';
  }

  async searchProducts(query: string, options?: SearchOptions): Promise<Product[]> {
    if (!isConfigured()) {
      console.error('[Marketplace] Missing configuration. Requires EBAY_CLIENT_ID, EBAY_CLIENT_SECRET.');
      return [];
    }

    const cacheKey = `mkt:search:${query}:${JSON.stringify(options || {})}`;
    const cached = cache.get<Product[]>(cacheKey);
    if (cached) return cached;

    const token = await getAccessToken();
    if (!token) return [];

    const params = new URLSearchParams({
      q: query,
      limit: String(Math.min(options?.limit || 10, 50)),
      ...(options?.offset ? { offset: String(options.offset) } : {}),
      ...(options?.sortBy === 'price_asc' ? { sort: 'price' } : options?.sortBy === 'price_desc' ? { sort: '-price' } : {}),
    });

    try {
      const response = await fetch(`${EBAY_API_BASE}/buy/browse/v1/item_summary/search?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
        },
      });

      if (!response.ok) {
        console.error(`[Marketplace] Search error ${response.status}:`, await response.text());
        return [];
      }

      const data = await response.json();
      const products = (data.itemSummaries || []).map(normalizeProduct).filter((p: Product) => p.price.amount > 0);

      cache.set(cacheKey, products, 300);
      return products;
    } catch (err) {
      console.error('[Marketplace] Search failed:', err);
      return [];
    }
  }

  async getProduct(productId: string): Promise<Product | null> {
    if (!isConfigured()) return null;

    const itemId = productId.replace('mkt-', '');
    const cacheKey = `mkt:product:${itemId}`;
    const cached = cache.get<Product>(cacheKey);
    if (cached) return cached;

    const token = await getAccessToken();
    if (!token) return null;

    try {
      const response = await fetch(`${EBAY_API_BASE}/buy/browse/v1/item/${itemId}`, {
        headers: { Authorization: `Bearer ${token}`, 'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US' },
      });

      if (!response.ok) return null;
      const item = await response.json();
      const product = normalizeProduct(item);
      cache.set(cacheKey, product, 600);
      return product;
    } catch {
      return null;
    }
  }

  async getAvailability(productId: string): Promise<Availability> {
    const product = await this.getProduct(productId);
    return product?.availability || { available: false };
  }

  async getPrice(productId: string): Promise<Price> {
    const product = await this.getProduct(productId);
    return product?.price || { amount: 0, currency: 'USD' };
  }

  async getShipping(productId: string): Promise<ShippingInfo> {
    const product = await this.getProduct(productId);
    return product?.shipping || { available: false };
  }
}
