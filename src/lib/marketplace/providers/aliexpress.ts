import type { MarketplaceProvider, Product, SearchOptions, MarketplaceStatus, Availability, Price, ShippingInfo } from '@/types';
import { cache } from '@/lib/cache/store';
import { DropshipperClient } from 'ae_sdk';

// ═══════════════════════════════════════════════════
// MÖBIUS — AliExpress Dropshipping API
//
// Built on the `ae_sdk` package, which correctly implements
// AliExpress's request signing (a subtlety that's easy to get wrong
// by hand — see scripts/get-access-token.mjs history for why).
//
// aliexpress.ds.text.search isn't in ae_sdk's typed method list yet,
// so it's called via callAPIDirectly(); aliexpress.ds.product.get
// has a typed wrapper (productDetails()) which is used directly.
//
// UI NOTE: presented to end users generically as "Marketplace" — the
// underlying supplier is an implementation detail, not a user-facing claim.
// ═══════════════════════════════════════════════════

function getConfig() {
  return {
    appKey: process.env.ALIEXPRESS_APP_KEY || '',
    appSecret: process.env.ALIEXPRESS_APP_SECRET || '',
    accessToken: process.env.ALIEXPRESS_ACCESS_TOKEN || '',
    isProduction: process.env.ALIEXPRESS_APP_STATUS === 'production',
    shipToCountry: process.env.ALIEXPRESS_SHIP_TO_COUNTRY || 'US',
    currency: process.env.ALIEXPRESS_CURRENCY || 'USD',
    locale: process.env.ALIEXPRESS_LOCALE || 'en_US',
  };
}

function isConfigured(): boolean {
  const c = getConfig();
  return !!(c.appKey && c.appSecret && c.accessToken);
}

function getClient(): DropshipperClient {
  const config = getConfig();
  return new DropshipperClient({
    app_key: config.appKey,
    app_secret: config.appSecret,
    session: config.accessToken,
  });
}

// Maps aliexpress.ds.text.search's "selection_search_product" shape
function normalizeSearchProduct(item: any): Product {
  const salePrice = parseFloat(item.targetSalePrice || item.salePrice || '0');

  return {
    id: `mkt-${item.itemId}`,
    marketplace: 'marketplace',
    marketplaceProductId: String(item.itemId),
    merchant: undefined,
    title: item.title || 'Product',
    description: undefined,
    images: [item.itemMainPic].filter(Boolean),
    price: {
      amount: salePrice,
      currency: item.targetSalePriceCurrency || item.salePriceCurrency || 'USD',
    },
    availability: { available: true, quantity: undefined },
    shipping: {
      available: true,
      cost: undefined, // requires aliexpress.logistics.buyer.freight.calculate with a destination
      currency: 'USD',
      estimatedDelivery: '7-20 days',
    },
    productUrl: item.itemUrl ? (item.itemUrl.startsWith('http') ? item.itemUrl : `https:${item.itemUrl}`) : '',
    category: item.cateId || undefined,
    checkout: { supported: true, mode: 'merchant_redirect' },
  };
}

// Maps aliexpress.ds.product.get's response (via ae_sdk's productDetails())
function normalizeProductDetail(item: any): Product {
  const base = item.ae_item_base_info_dto || {};
  const sku = item.ae_item_sku_info_dtos?.[0];
  const price = parseFloat(sku?.offer_sale_price || base.sale_price || '0');

  return {
    id: `mkt-${base.product_id}`,
    marketplace: 'marketplace',
    marketplaceProductId: String(base.product_id),
    merchant: undefined,
    title: base.subject || 'Product',
    description: base.detail || undefined,
    images: (base.image_urls || '').split(';').filter(Boolean),
    price: { amount: price, currency: base.currency_code || 'USD' },
    availability: { available: true, quantity: undefined },
    shipping: { available: true, cost: undefined, currency: 'USD', estimatedDelivery: '7-20 days' },
    productUrl: base.detail_url || '',
    category: base.category_id || undefined,
    checkout: { supported: true, mode: 'merchant_redirect' },
  };
}

export class AliExpressProvider implements MarketplaceProvider {
  id = 'marketplace';
  name = 'Marketplace';
  color = '#4c60f1';

  async getStatus(): Promise<MarketplaceStatus> {
    const config = getConfig();
    if (!config.appKey || !config.appSecret) return 'configuration_required';
    if (!config.accessToken) return 'configuration_required';
    if (!config.isProduction) return 'configuration_required';
    return 'connected';
  }

  async searchProducts(query: string, options?: SearchOptions): Promise<Product[]> {
    const config = getConfig();

    if (!isConfigured()) {
      console.error('[Marketplace] Missing configuration. Requires ALIEXPRESS_APP_KEY, ALIEXPRESS_APP_SECRET, ALIEXPRESS_ACCESS_TOKEN.');
      return [];
    }
    if (!config.isProduction) {
      console.warn('[Marketplace] App is not in production status — results may be empty or restricted.');
    }

    const cacheKey = `mkt:search:${query}:${JSON.stringify(options || {})}`;
    const cached = cache.get<Product[]>(cacheKey);
    if (cached) return cached;

    const pageSize = Math.min(options?.limit || 10, 50);
    const pageIndex = Math.floor((options?.offset || 0) / pageSize) + 1;

    try {
      const client = getClient();
      const result = await client.callAPIDirectly('aliexpress.ds.text.search', {
        keyWord: query,
        pageIndex,
        pageSize,
        shipToCountry: config.shipToCountry,
        currency: config.currency,
        local: config.locale,
      });

      if (!result.ok) {
        console.error('[Marketplace] Search error:', result.message, result.error_response);
        return [];
      }

      const items = (result.data as any)?.aliexpress_ds_text_search_response?.data?.products?.selection_search_product || [];
      const products = items.map(normalizeSearchProduct).filter((p: Product) => p.price.amount > 0);

      cache.set(cacheKey, products, 300);
      return products;
    } catch (err) {
      console.error('[Marketplace] Request failed:', err);
      return [];
    }
  }

  async getProduct(productId: string): Promise<Product | null> {
    if (!isConfigured()) return null;

    const itemId = productId.replace('mkt-', '');
    const cacheKey = `mkt:product:${itemId}`;
    const cached = cache.get<Product>(cacheKey);
    if (cached) return cached;

    const config = getConfig();

    try {
      const client = getClient();
      const result = await client.productDetails({
        product_id: Number(itemId),
        ship_to_country: config.shipToCountry,
        target_currency: config.currency,
        target_language: config.locale.split('_')[0].toUpperCase(),
      } as any);

      if (!result.ok) {
        console.error('[Marketplace] Product fetch error:', result.message);
        return null;
      }

      const item = (result.data as any)?.aliexpress_ds_product_get_response?.result;
      if (!item) return null;

      const product = normalizeProductDetail(item);
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
