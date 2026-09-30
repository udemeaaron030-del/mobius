// ═══════════════════════════════════════════════════
// MÖBIUS — Core Type Definitions
// ═══════════════════════════════════════════════════

// ─── Normalized Product Model ───
export interface Product {
  id: string;
  marketplace: string;
  marketplaceProductId: string;
  merchant?: string;
  title: string;
  description?: string;
  images: string[];
  price: {
    amount: number;
    currency: string;
  };
  availability?: {
    available: boolean;
    quantity?: number;
  };
  shipping?: {
    available: boolean;
    cost?: number;
    currency?: string;
    estimatedDelivery?: string;
  };
  productUrl: string;
  category?: string;
  checkout?: {
    supported: boolean;
    mode: 'merchant_redirect' | 'api_checkout' | 'future';
  };
}

// ─── Marketplace Types ───
export type MarketplaceStatus = 'connected' | 'configuration_required' | 'unavailable' | 'error';

export interface MarketplaceInfo {
  id: string;
  name: string;
  color: string;
  status: MarketplaceStatus;
  message?: string;
}

export interface SearchOptions {
  limit?: number;
  offset?: number;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'price_asc' | 'price_desc' | 'relevance';
}

export interface SearchResult {
  products: Product[];
  total: number;
  marketplaces: Record<string, MarketplaceStatus>;
  errors: Array<{ marketplace: string; error: string }>;
}

export interface ShippingInfo {
  available: boolean;
  cost?: number;
  currency?: string;
  estimatedDelivery?: string;
}

export interface Availability {
  available: boolean;
  quantity?: number;
}

export interface Price {
  amount: number;
  currency: string;
}

// ─── Marketplace Provider Interface ───
export interface MarketplaceProvider {
  id: string;
  name: string;
  color: string;
  getStatus(): Promise<MarketplaceStatus>;
  searchProducts(query: string, options?: SearchOptions): Promise<Product[]>;
  getProduct(productId: string): Promise<Product | null>;
  getAvailability(productId: string): Promise<Availability>;
  getPrice(productId: string): Promise<Price>;
  getShipping(productId: string, destination?: string): Promise<ShippingInfo>;
}

// ─── Payment Types ───
export interface PaymentQuote {
  id: string;
  productId: string;
  marketplace: string;
  productPrice: number;
  deliveryFee: number;
  subsidyAmount: number;
  userPaysDelivery: number;
  totalMerchantCost: number;
  mobiusAmount: number;
  mobiusRate: number;
  currency: string;
  recipient: string;
  tokenMint: string;
  network: string;
  createdAt: number;
  expiresAt: number;
  status: 'pending' | 'processing' | 'confirmed' | 'expired' | 'failed';
  signature?: string;
}

export interface PaymentVerification {
  valid: boolean;
  signature: string;
  sender: string;
  recipient: string;
  amount: number;
  tokenMint: string;
  confirmed: boolean;
  slot?: number;
  error?: string;
}

// ─── Order Types ───
export type OrderStatus =
  | 'created'
  | 'payment_pending'
  | 'payment_detected'
  | 'payment_confirmed'
  | 'order_submitted'
  | 'merchant_processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refund_pending'
  | 'refunded'
  | 'failed';

export interface Order {
  id: string;
  userId: string;
  walletAddress: string;
  product: {
    id: string;
    title: string;
    marketplace: string;
    merchant?: string;
    image?: string;
    productUrl: string;
  };
  pricing: {
    productPrice: number;
    deliveryFee: number;
    subsidyAmount: number;
    userPaysDelivery: number;
    totalMerchantCost: number;
    mobiusAmount: number;
    currency: string;
  };
  payment: {
    quoteId: string;
    transactionSignature?: string;
    confirmedAt?: number;
  };
  merchantReference?: string;
  status: OrderStatus;
  statusHistory: Array<{
    status: OrderStatus;
    timestamp: number;
    note?: string;
  }>;
  createdAt: number;
  updatedAt: number;
}

// ─── Delivery Subsidy Types ───
export interface SubsidyEligibility {
  eligible: boolean;
  deliveryFee: number;
  coveredAmount: number;
  userPays: number;
  reason?: string;
}

export interface SubsidyConfig {
  maxPerOrder: number;
  maxDailyTotal: number;
  maxMonthlyTotal: number;
  minOrderValue: number;
  minMobiusBalance: number;
  eligibleMarketplaces: string[] | 'all';
  eligibleCountries: string[] | 'all';
}

export interface SubsidyRecord {
  id: string;
  orderId: string;
  userId: string;
  walletAddress: string;
  marketplace: string;
  deliveryFee: number;
  coveredAmount: number;
  source: 'creator_fees';
  timestamp: number;
  status: 'applied' | 'reversed';
}

// ─── Holder Verification Types ───
export interface HolderStatus {
  wallet: string;
  connected: boolean;
  mobiusBalance: number;
  eligible: boolean;
  tier: 'none' | 'holder' | 'premium';
  minimumRequired: number;
}

// ─── API Response Types ───
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ─── Rate Limit Types ───
export interface RateLimitInfo {
  remaining: number;
  reset: number;
  limit: number;
}
