'use client';

import type { Product } from '@/types';
import ProductCard from './ProductCard';

interface ProductGridProps {
  products: Product[];
  loading: boolean;
  error: string | null;
  hasSearched: boolean;
  mobiusRate: number;
  wishlist: Set<string>;
  deliveryEligible: boolean;
  onSelect: (product: Product) => void;
  onToggleWishlist: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

function SkeletonCard() {
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="skeleton w-full h-44" />
      <div className="p-3 space-y-2">
        <div className="skeleton h-3 w-full rounded" />
        <div className="skeleton h-3 w-2/3 rounded" />
        <div className="skeleton h-8 w-full rounded-lg mt-2" />
      </div>
    </div>
  );
}

export default function ProductGrid({ products, loading, error, hasSearched, mobiusRate, wishlist, deliveryEligible, onSelect, onToggleWishlist, onAddToCart }: ProductGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass rounded-2xl p-10 text-center">
        <div className="relative z-[2]">
          <p className="text-[var(--t1)] font-semibold mb-1">Something went wrong</p>
          <p className="text-[var(--t2)] text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (hasSearched && products.length === 0) {
    return (
      <div className="glass rounded-2xl p-10 text-center">
        <div className="relative z-[2]">
          <p className="text-[var(--t1)] font-semibold mb-1">No products found</p>
          <p className="text-[var(--t2)] text-sm">Try a different search term.</p>
        </div>
      </div>
    );
  }

  if (!hasSearched && products.length === 0) {
    return (
      <div className="text-center py-16 text-[var(--t3)] text-sm">
        Search above to discover products from connected marketplaces.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          mobiusRate={mobiusRate}
          isWishlisted={wishlist.has(product.id)}
          deliveryEligible={deliveryEligible}
          onSelect={onSelect}
          onToggleWishlist={onToggleWishlist}
          onAddToCart={onAddToCart}
        />
      ))}
    </div>
  );
}
