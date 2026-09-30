'use client';

import Image from 'next/image';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  mobiusRate: number;
  isWishlisted: boolean;
  deliveryEligible: boolean;
  onSelect: (product: Product) => void;
  onToggleWishlist: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export default function ProductCard({ product, mobiusRate, isWishlisted, deliveryEligible, onSelect, onToggleWishlist, onAddToCart }: ProductCardProps) {
  const image = product.images[0];
  const mobiusEquivalent = (product.price.amount / mobiusRate).toFixed(4);
  const rating = (4.4 + (product.id.charCodeAt(4) % 6) / 10).toFixed(1);
  const reviews = 800 + (product.id.charCodeAt(5) * 137) % 12000;

  return (
    <div
      onClick={() => onSelect(product)}
      className="group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1.5"
      style={{
        background: 'linear-gradient(180deg, rgba(14,20,48,.6), rgba(8,12,32,.7))',
        border: '1px solid rgba(255,255,255,.06)',
      }}
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ boxShadow: '0 16px 48px rgba(0,0,0,.4), 0 0 0 1px rgba(124,131,253,.25), 0 0 32px rgba(76,96,241,.15)' }}
      />

      <div className="relative w-full h-48 bg-gradient-to-br from-[#0c1230] to-[#161c3f] flex items-center justify-center overflow-hidden">
        <span className="absolute top-2.5 left-2.5 z-10 px-2 py-1 rounded-md text-[9px] font-bold tracking-wider bg-[rgba(76,96,241,.15)] border border-[rgba(76,96,241,.25)] text-[#9ca8ff] backdrop-blur-md">
          GLOBAL
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleWishlist(product); }}
          className="absolute top-2.5 right-2.5 z-10 w-7 h-7 rounded-full flex items-center justify-center bg-[rgba(2,5,16,.5)] border border-white/10 transition-colors backdrop-blur-md"
          style={{ color: isWishlisted ? '#f472b6' : 'rgba(255,255,255,.7)' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill={isWishlisted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 000-7.8z" />
          </svg>
        </button>
        {image ? (
          <Image
            src={image}
            alt={product.title}
            width={220}
            height={176}
            className="object-contain h-[78%] w-auto relative z-[1] transition-transform duration-500 group-hover:scale-105"
            unoptimized
          />
        ) : (
          <span className="text-5xl opacity-20 relative z-[1]">📦</span>
        )}
      </div>

      <div className="p-4">
        <div className="text-[13px] font-semibold leading-snug mb-1.5 line-clamp-2 min-h-[36px] text-white/90">
          {product.title}
        </div>

        <div className="flex items-center gap-1 mb-2">
          <div className="flex text-[#ffb545] text-[11px] gap-0.5">
            {'★★★★★'.split('').map((s, i) => (
              <span key={i} style={{ opacity: i < Math.round(parseFloat(rating)) ? 1 : 0.25 }}>★</span>
            ))}
          </div>
          <span className="text-[10px] text-white/40 ml-0.5">{rating} ({reviews.toLocaleString()})</span>
        </div>

        <div className="flex items-baseline gap-1.5 mb-3">
          <span className="text-xl font-extrabold font-display text-white">
            ${product.price.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="text-[10.5px] font-medium mb-2" style={{ color: '#8b93ff' }}>
          ≈ {mobiusEquivalent} MÖBIUS
        </div>

        {deliveryEligible && (
          <div className="flex items-center gap-1.5 mb-3 text-[10px] font-semibold" style={{ color: '#4ade80' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>
            Delivery covered by MÖBIUS
          </div>
        )}

        <button
          onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
          className="w-full py-2.5 rounded-lg text-[11.5px] font-bold text-white flex items-center justify-center gap-1.5 transition-all"
          style={{ background: 'linear-gradient(135deg,#4c60f1,#7b5cf0 60%,#a44bf7)', boxShadow: '0 0 0 rgba(76,96,241,0)' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
          </svg>
          Quick add
        </button>
      </div>
    </div>
  );
}

