'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { useMobiusWallet } from '@/components/wallet/WalletProvider';
import WalletModal from '@/components/wallet/WalletModal';
import ConnectButton from '@/components/wallet/ConnectButton';
import ProductGrid from '@/components/products/ProductGrid';
import { useProducts } from '@/hooks/useProducts';
import { useTokenPrice } from '@/hooks/useTokenPrice';
import { useWalletBalance } from '@/hooks/useWalletBalance';
import { useLaunchStatus } from '@/hooks/useLaunchStatus';
import LaunchCountdownModal from '@/components/LaunchCountdownModal';
import type { Product } from '@/types';

const ANNOUNCEMENTS = [
  'PAY WITH CRYPTO  ·  SHOP ANYWHERE  ·  NO FRICTION',
  'REAL PRODUCTS  ·  REAL PRICES',
  'ONE WALLET  ·  GLOBAL SHOPPING',
];

const CATEGORIES = [
  { name: 'Electronics', icon: 'M4 5h16v11H4zM8 19h8' },
  { name: 'Fashion', icon: 'M6 3l2 2h8l2-2M9 5v3a3 3 0 006 0V5M5 8l2 12h10l2-12' },
  { name: 'Home', icon: 'M3 11l9-8 9 8M5 10v10h14V10' },
  { name: 'Beauty', icon: 'M8 3v4a4 4 0 008 0V3M6 12h12v9H6z' },
  { name: 'Gaming', icon: 'M6 9h4m-2-2v4m7-1h.01M17 10h.01M2 8a4 4 0 014-4h12a4 4 0 014 4v6a4 4 0 01-4 4h-2l-2 3h-4l-2-3H6a4 4 0 01-4-4z' },
  { name: 'Travel', icon: 'M2 12h20M12 2c2.5 3 4 7 4 10s-1.5 7-4 10c-2.5-3-4-7-4-10s1.5-7 4-10z' },
];

const SHOP_CATEGORIES = [
  { name: 'Electronics', desc: 'Everyday tech to serious hardware.', img: '/images/cat-electronics.jpg' },
  { name: 'Fashion', desc: 'Sneakers, streetwear, and staples.', img: '/images/cat-fashion.jpg' },
  { name: 'Home', desc: 'Everything to make it feel like yours.', img: '/images/cat-home.jpg' },
  { name: 'Beauty', desc: 'Skincare, fragrance, and self-care.', img: '/images/cat-beauty.jpg' },
  { name: 'Gaming', desc: 'Consoles, gear, and accessories.', img: '/images/cat-gaming.jpg' },
  { name: 'Travel', desc: 'Luggage, gear, and essentials.', img: '/images/cat-travel.jpg' },
];

const WALLET_FLOW = [
  { label: 'Your Wallet', sub: 'Connect & approve', img: '/images/icon-wallet.png' },
  { label: 'MÖBIUS', sub: 'Secure & seamless', img: '/images/icon-mobius.jpg' },
  { label: 'Global Market', sub: 'Millions of items', img: '/images/icon-globe.png' },
];

const HOW_STEPS = [
  { n: '01', t: 'Connect', d: 'Connect your wallet.', img: '/images/icon-wallet.png' },
  { n: '02', t: 'Search', d: 'Find anything you want.', img: '/images/icon-search.png' },
  { n: '03', t: 'Pay', d: 'Pay with supported crypto.', img: '/images/icon-pay.png' },
  { n: '04', t: 'Deliver', d: 'Track your order until it arrives.', img: '/images/icon-deliver.png' },
];

export default function HomePage() {
  const { connected } = useMobiusWallet();
  const { balance: walletBalance, eligible: deliveryEligible, minRequired } = useWalletBalance();
  const { enabled: buyingEnabled, secondsRemaining, launched } = useLaunchStatus();
  const [countdownOpen, setCountdownOpen] = useState(false);
  const { price: mobiusRate } = useTokenPrice();
  const { products, loading, error, search } = useProducts();

  const [query, setQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [announceIdx, setAnnounceIdx] = useState(0);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  // Header interactive state
  const [searchOverlayOpen, setSearchOverlayOpen] = useState(false);
  const [headerQuery, setHeaderQuery] = useState('');
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [cart, setCart] = useState<Product[]>([]);

  // Waitlist modal
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistStatus, setWaitlistStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  const placeholders = ['Search for a MacBook...', 'Search for sneakers...', 'Search for anything...', 'Search for headphones...'];
  const wishlistIds = new Set(wishlist.map((p) => p.id));

  useEffect(() => {
    const t = setInterval(() => setAnnounceIdx((i) => (i + 1) % ANNOUNCEMENTS.length), 4000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setPlaceholderIdx((i) => (i + 1) % placeholders.length), 3000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Type "mobius" anywhere on the site to jump to the admin panel.
  useEffect(() => {
    let buffer = '';
    let resetTimer: ReturnType<typeof setTimeout>;

    const onKeyDown = (e: KeyboardEvent) => {
      // Ignore typing while an actual input/textarea is focused
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      buffer = (buffer + e.key.toLowerCase()).slice(-6);
      clearTimeout(resetTimer);
      resetTimer = setTimeout(() => { buffer = ''; }, 2000);

      if (buffer === 'mobius') {
        window.location.href = '/admin';
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => { window.removeEventListener('keydown', onKeyDown); clearTimeout(resetTimer); };
  }, []);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setHasSearched(true);
    search(query.trim());
    document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' });
  }, [query, search]);

  const handleHeaderSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!headerQuery.trim()) return;
    setQuery(headerQuery.trim());
    setHasSearched(true);
    search(headerQuery.trim());
    setSearchOverlayOpen(false);
    document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' });
  }, [headerQuery, search]);

  const toggleWishlist = useCallback((product: Product) => {
    setWishlist((prev) => prev.some((p) => p.id === product.id) ? prev.filter((p) => p.id !== product.id) : [...prev, product]);
  }, []);

  const addToCart = useCallback((product: Product) => {
    setCart((prev) => [...prev, product]);
    setCartOpen(true);
  }, []);

  const removeFromCart = useCallback((index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const cartTotal = cart.reduce((sum, p) => sum + p.price.amount, 0);

  const attemptPay = useCallback(() => {
    if (launched && !buyingEnabled) {
      setCountdownOpen(true);
      return false;
    }
    return true;
  }, [launched, buyingEnabled]);

  const submitWaitlist = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setWaitlistStatus('loading');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: waitlistEmail }),
      });
      const data = await res.json();
      setWaitlistStatus(data.success ? 'done' : 'error');
    } catch {
      setWaitlistStatus('error');
    }
  }, [waitlistEmail]);

  return (
    <div className="min-h-screen">
      {/* ANNOUNCEMENT BAR */}
      <div className="fixed top-0 left-0 right-0 z-[110] h-7 flex items-center justify-center overflow-hidden text-[10px] font-semibold tracking-[1.5px] px-4"
        style={{ background: 'linear-gradient(90deg,#0a0e2a,#141a3d,#0a0e2a)', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
        <span key={announceIdx} className="animate-[fadeIn_.5s_ease] text-center truncate" style={{ color: '#8b93ff' }}>
          {ANNOUNCEMENTS[announceIdx]}
        </span>
      </div>

      {/* NAV */}
      <header
        className="fixed top-7 left-0 right-0 z-[100] transition-all duration-300"
        style={{
          background: scrolled ? 'rgba(4,7,22,0.75)' : 'rgba(4,7,22,0.3)',
          backdropFilter: 'blur(24px)',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,.07)' : '1px solid transparent',
        }}
      >
        <div className="max-w-[1240px] mx-auto flex items-center justify-between px-4 sm:px-6 h-16">
          <a href="#" className="flex items-center gap-2 sm:gap-2.5 cursor-pointer flex-shrink-0">
            <Image src="/images/logo-nav.png" alt="MÖBIUS" width={26} height={26} className="logo-glow" priority />
            <span className="font-display font-bold text-base sm:text-lg tracking-tight">MÖBIUS</span>
          </a>

          <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            <a href="#shop" className="text-[13.5px] font-medium text-white/60 hover:text-white transition-colors">Shop</a>
            <a href="#discover" className="text-[13.5px] font-medium text-white/60 hover:text-white transition-colors">Discover</a>
            <a href="#how" className="text-[13.5px] font-medium text-white/60 hover:text-white transition-colors">How It Works</a>
            <a href="#mobiuscard" className="text-[13.5px] font-medium text-white/60 hover:text-white transition-colors">MÖBIUS Card</a>
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-3">
            {connected && walletBalance != null && (
              <span className="hidden sm:flex items-center gap-1.5 text-[11.5px] font-semibold px-3 py-1.5 rounded-full" style={{ color: '#8b93ff', background: 'rgba(124,92,240,.08)', border: '1px solid rgba(124,92,240,.2)' }}>
                {walletBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })} MÖBIUS
                {deliveryEligible && <span style={{ color: '#4ade80' }}>· Delivery unlocked</span>}
              </span>
            )}

            <button onClick={() => setSearchOverlayOpen(true)} aria-label="Search" className="w-9 h-9 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 transition-colors">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg>
            </button>
            <button onClick={() => setWishlistOpen(true)} aria-label="Wishlist" className="relative w-9 h-9 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 transition-colors">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 000-7.8z" /></svg>
              {wishlist.length > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#f472b6] text-[9px] font-bold flex items-center justify-center">{wishlist.length}</span>}
            </button>
            <button onClick={() => setCartOpen(true)} aria-label="Cart" className="relative w-9 h-9 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 transition-colors">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" /></svg>
              {cart.length > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#7b5cf0] text-[9px] font-bold flex items-center justify-center">{cart.length}</span>}
            </button>
            <ConnectButton />
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden bg-transparent border-0 text-white cursor-pointer p-1">☰</button>
          </div>
        </div>
      </header>

      {/* SEARCH OVERLAY */}
      {searchOverlayOpen && (
        <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-start justify-center pt-32 px-4" onClick={() => setSearchOverlayOpen(false)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={handleHeaderSearch} className="w-full max-w-lg rounded-2xl p-2 flex items-center gap-2"
            style={{ background: 'rgba(14,18,42,.95)', border: '1px solid rgba(255,255,255,.12)' }}>
            <svg className="ml-3 flex-shrink-0" width="18" height="18" fill="none" stroke="#7b84ff" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg>
            <input autoFocus value={headerQuery} onChange={(e) => setHeaderQuery(e.target.value)} placeholder="What are you looking for?"
              className="flex-1 bg-transparent border-0 outline-none text-[15px] py-3 placeholder:text-white/30" />
            <button type="submit" className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white" style={{ background: 'linear-gradient(135deg,#4c60f1,#7b5cf0)' }}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </button>
          </form>
        </div>
      )}

      {/* WISHLIST DRAWER */}
      {wishlistOpen && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm" onClick={() => setWishlistOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="fixed top-0 right-0 h-full w-full max-w-sm p-6 overflow-y-auto"
            style={{ background: 'rgba(8,11,28,.98)', borderLeft: '1px solid rgba(255,255,255,.08)' }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display font-bold text-lg">Wishlist</h3>
              <button onClick={() => setWishlistOpen(false)} className="text-white/40 bg-transparent border-0 cursor-pointer">✕</button>
            </div>
            {wishlist.length === 0 ? (
              <p className="text-white/40 text-sm">Nothing saved yet. Tap the heart on any product to save it here.</p>
            ) : (
              <div className="space-y-3">
                {wishlist.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 p-2 rounded-xl" style={{ background: 'rgba(255,255,255,.03)' }}>
                    <div className="w-12 h-12 rounded-lg flex-shrink-0 bg-white/5 flex items-center justify-center overflow-hidden">
                      {p.images[0] ? <Image src={p.images[0]} alt="" width={48} height={48} className="object-contain" unoptimized /> : '📦'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-semibold truncate">{p.title}</div>
                      <div className="text-[13px] font-bold">${p.price.amount.toLocaleString()}</div>
                    </div>
                    <button onClick={() => toggleWishlist(p)} className="text-white/30 hover:text-white/70 bg-transparent border-0 cursor-pointer">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CART DRAWER */}
      {cartOpen && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm" onClick={() => setCartOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="fixed top-0 right-0 h-full w-full max-w-sm p-6 overflow-y-auto flex flex-col"
            style={{ background: 'rgba(8,11,28,.98)', borderLeft: '1px solid rgba(255,255,255,.08)' }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display font-bold text-lg">Your Cart</h3>
              <button onClick={() => setCartOpen(false)} className="text-white/40 bg-transparent border-0 cursor-pointer">✕</button>
            </div>
            {cart.length === 0 ? (
              <p className="text-white/40 text-sm">Your cart is empty.</p>
            ) : (
              <>
                <div className="space-y-3 flex-1">
                  {cart.map((p, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-xl" style={{ background: 'rgba(255,255,255,.03)' }}>
                      <div className="w-12 h-12 rounded-lg flex-shrink-0 bg-white/5 flex items-center justify-center overflow-hidden">
                        {p.images[0] ? <Image src={p.images[0]} alt="" width={48} height={48} className="object-contain" unoptimized /> : '📦'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-semibold truncate">{p.title}</div>
                        <div className="text-[13px] font-bold">${p.price.amount.toLocaleString()}</div>
                      </div>
                      <button onClick={() => removeFromCart(i)} className="text-white/30 hover:text-white/70 bg-transparent border-0 cursor-pointer">✕</button>
                    </div>
                  ))}
                </div>
                <div className="pt-4 mt-4 border-t border-white/10">
                  <div className="flex justify-between text-[13px] mb-1"><span className="text-white/50">Subtotal</span><span className="font-bold">${cartTotal.toLocaleString()}</span></div>
                  <div className="flex justify-between text-[11.5px] mb-4" style={{ color: '#8b93ff' }}><span>≈ MÖBIUS</span><span>{(cartTotal / mobiusRate).toFixed(4)}</span></div>
                  <button disabled={!connected} onClick={() => attemptPay()} className="w-full py-3 rounded-xl font-bold text-white disabled:opacity-40" style={{ background: 'linear-gradient(135deg,#4c60f1,#7b5cf0)' }}>
                    {connected ? 'Checkout' : 'Connect wallet to checkout'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[150] bg-[rgba(2,5,16,0.96)] backdrop-blur-2xl flex flex-col pt-24 px-6">
          <a href="#shop" onClick={() => setMobileMenuOpen(false)} className="py-3 text-base font-semibold border-b border-white/10">Shop</a>
          <a href="#discover" onClick={() => setMobileMenuOpen(false)} className="py-3 text-base font-semibold border-b border-white/10">Discover</a>
          <a href="#how" onClick={() => setMobileMenuOpen(false)} className="py-3 text-base font-semibold border-b border-white/10">How It Works</a>
          <a href="#mobiuscard" onClick={() => setMobileMenuOpen(false)} className="py-3 text-base font-semibold border-b border-white/10">MÖBIUS Card</a>
        </div>
      )}

      {/* HERO */}
      <div className="relative overflow-hidden min-h-[560px] sm:min-h-[640px] lg:min-h-[760px] flex items-center">
        <div className="absolute inset-0 z-0">
          <div className="md:hidden absolute inset-0 overflow-hidden">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: "url('/images/hero.jpg')",
                backgroundSize: 'cover',
                backgroundPosition: 'center center',
                filter: 'blur(50px) saturate(1.4) brightness(0.7)',
                transform: 'scale(1.25)',
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: "url('/images/hero.jpg')",
                backgroundSize: 'contain',
                backgroundPosition: 'center center',
                backgroundRepeat: 'no-repeat',
                WebkitMaskImage: 'radial-gradient(ellipse 65% 70% at 50% 62%, black 30%, transparent 75%)',
                maskImage: 'radial-gradient(ellipse 65% 70% at 50% 62%, black 30%, transparent 75%)',
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat',
                WebkitMaskSize: '100% 100%',
                maskSize: '100% 100%',
              }}
            />
          </div>
          <div className="hidden md:block absolute inset-0">
            <Image
              src="/images/hero.jpg"
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover object-[center_35%]"
            />
          </div>
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(2,5,16,.5) 0%, rgba(2,5,16,.1) 30%, rgba(2,5,16,.15) 55%, rgba(2,5,16,.65) 85%, rgba(2,5,16,1) 100%)' }} />
          <div className="md:hidden absolute inset-x-0 top-0 h-24" style={{ background: 'linear-gradient(to bottom, rgba(2,5,16,1), transparent)' }} />
        </div>

        <section className="relative z-[1] w-full pt-24 pb-20 px-4 sm:px-6">
          <div className="max-w-[1240px] mx-auto">
            <div className="max-w-[640px]">
              <div className="text-[11px] font-bold tracking-[3px] uppercase mb-5" style={{ color: '#7b84ff' }}>The Crypto Commerce Layer</div>
              <h1 className="font-display font-extrabold leading-[0.98] mb-5" style={{ fontSize: 'clamp(34px,5.5vw,68px)' }}>
                Hold MÖBIUS.<br />
                <span style={{ background: 'linear-gradient(90deg,#6b7cff,#a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  Shop anything.
                </span>
              </h1>
              <p className="text-white/55 text-[15px] sm:text-[16px] max-w-[440px] mb-8 leading-relaxed">
                Use your MÖBIUS tokens and supported crypto to buy from the internet&apos;s biggest stores — no cash, no ID, no hassle.
              </p>

              <form onSubmit={handleSearch} className="flex items-center gap-2 rounded-2xl p-1.5 max-w-[480px]"
                style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', backdropFilter: 'blur(20px)' }}>
                <svg className="ml-3 flex-shrink-0" width="17" height="17" fill="none" stroke="#7b84ff" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={placeholders[placeholderIdx]}
                  className="flex-1 bg-transparent border-0 outline-none text-[14px] py-2.5 placeholder:text-white/30 transition-all min-w-0"
                />
                <button type="submit" className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white" style={{ background: 'linear-gradient(135deg,#4c60f1,#7b5cf0)' }}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                </button>
              </form>
              <div className="text-[11.5px] text-white/35 mt-3">Search connected marketplaces &middot; real products &middot; real prices</div>
            </div>
          </div>
        </section>
      </div>

      {/* CATEGORY PILLS */}
      <section className="max-w-[1240px] mx-auto px-4 sm:px-6 pb-14">
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {CATEGORIES.map((cat) => (
            <button key={cat.name} className="flex items-center gap-2 px-4 py-2.5 rounded-full text-[12.5px] font-semibold whitespace-nowrap flex-shrink-0 transition-all hover:border-white/25"
              style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3ff" strokeWidth="1.8"><path d={cat.icon} /></svg>
              {cat.name}
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-40"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </button>
          ))}
        </div>
      </section>

      {/* TRENDING / RESULTS */}
      <section id="shop" className="max-w-[1240px] mx-auto px-4 sm:px-6 pb-20 scroll-mt-28">
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-bold tracking-[2px] uppercase mb-1.5" style={{ color: '#7b84ff' }}>
              <svg width="12" height="12" fill="#7b84ff" viewBox="0 0 24 24"><path d="M13 2L3 14h7v8l10-12h-7z" /></svg>
              {hasSearched ? 'Search Results' : 'Trending Now'}
            </div>
            <h2 className="font-display font-extrabold text-[22px] sm:text-[26px]">{hasSearched ? `Results for "${query}"` : "What's moving across the global marketplace."}</h2>
          </div>
        </div>
        <ProductGrid
          products={products}
          loading={loading}
          error={error}
          hasSearched={hasSearched}
          mobiusRate={mobiusRate}
          wishlist={wishlistIds}
          deliveryEligible={deliveryEligible}
          onSelect={setSelectedProduct}
          onToggleWishlist={toggleWishlist}
          onAddToCart={addToCart}
        />
      </section>

      {/* ONE WALLET. EVERY STORE. */}
      <section className="max-w-[1240px] mx-auto px-4 sm:px-6 pb-20">
        <div className="rounded-3xl p-7 sm:p-9 md:p-12 grid md:grid-cols-[1fr_1.1fr] gap-8 md:gap-10 items-center relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg,rgba(76,96,241,.06),rgba(123,92,240,.03))', border: '1px solid rgba(255,255,255,.07)' }}>
          <div>
            <div className="text-[10.5px] font-bold tracking-[2.5px] uppercase mb-3" style={{ color: '#7b84ff' }}>How it works</div>
            <h2 className="font-display font-extrabold text-[26px] sm:text-[30px] leading-tight mb-3">One wallet.<br />Every store.</h2>
            <p className="text-white/55 text-[14.5px] leading-relaxed">Connect your wallet, choose what you want, and pay with your MÖBIUS tokens or supported crypto. It&apos;s that simple.</p>
          </div>
          <div className="flex items-center justify-between gap-1">
            {WALLET_FLOW.map((step, i, arr) => (
              <div key={step.label} className="flex items-center flex-1">
                <div className="flex flex-col items-center text-center flex-1">
                  <div className="relative w-14 h-14 rounded-2xl mb-2 overflow-hidden" style={{ border: '1px solid rgba(255,255,255,.1)' }}>
                    <Image src={step.img} alt={step.label} fill className="object-cover" />
                  </div>
                  <div className="text-[11.5px] font-bold">{step.label}</div>
                  <div className="text-[9.5px] text-white/40 mt-0.5">{step.sub}</div>
                </div>
                {i < arr.length - 1 && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.25)" strokeWidth="2" className="flex-shrink-0 mx-1 mb-6"><path d="M5 12h14M13 6l6 6-6 6" /></svg>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SHOP BY CATEGORY */}
      <section id="discover" className="max-w-[1240px] mx-auto px-4 sm:px-6 pb-20 scroll-mt-28">
        <h2 className="font-display font-extrabold text-[22px] sm:text-[26px] mb-6">Shop by category</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {SHOP_CATEGORIES.map((cat) => (
            <div key={cat.name} className="group relative rounded-2xl overflow-hidden h-36 sm:h-40 cursor-pointer" style={{ border: '1px solid rgba(255,255,255,.07)' }}>
              <Image src={cat.img} alt={cat.name} fill sizes="(max-width: 768px) 50vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(4,6,20,.1) 0%, rgba(4,6,20,.85) 100%)' }} />
              <div className="absolute inset-0 flex flex-col justify-end p-4">
                <div className="font-bold text-[15px] mb-0.5 flex items-center gap-1.5 text-white">
                  {cat.name}
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="transition-transform group-hover:translate-x-1"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                </div>
                <div className="text-[10.5px] text-white/70 leading-snug">{cat.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="max-w-[1240px] mx-auto px-4 sm:px-6 pb-20 scroll-mt-28">
        <div className="text-center mb-10">
          <h2 className="font-display font-extrabold text-[24px] sm:text-[28px]">How MÖBIUS works.</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {HOW_STEPS.map((s) => (
            <div key={s.n} className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)' }}>
              <div className="relative w-11 h-11 rounded-xl mb-3 overflow-hidden">
                <Image src={s.img} alt={s.t} fill className="object-cover" />
              </div>
              <div className="text-[11px] font-bold mb-1" style={{ color: '#7b84ff' }}>{s.n}</div>
              <div className="font-display font-bold text-[15px] uppercase mb-1">{s.t}</div>
              <div className="text-[12px] text-white/50">{s.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* MÖBIUS CARD */}
      <section id="mobiuscard" className="max-w-[1240px] mx-auto px-4 sm:px-6 pb-20 scroll-mt-28">
        <div className="rounded-3xl overflow-hidden grid md:grid-cols-2 items-center relative"
          style={{ background: 'linear-gradient(135deg, rgba(76,96,241,.08), rgba(20,24,58,.6))', border: '1px solid rgba(255,255,255,.08)' }}>
          <div
            className="absolute -top-24 -right-24 w-80 h-80 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(168,85,247,.18), transparent 70%)' }}
          />
          <div className="p-8 sm:p-10 md:p-12 relative z-[1]">
            <div className="text-[10.5px] font-bold tracking-[2.5px] uppercase mb-3" style={{ color: '#a855f7' }}>Coming Soon</div>
            <h2 className="font-display font-extrabold text-[24px] sm:text-[28px] mb-2">Your crypto.<br />Everyday spending.</h2>
            <p className="text-white/50 text-[14px] mb-6">Spend your MÖBIUS anywhere cards are accepted.</p>
            <button onClick={() => setWaitlistOpen(true)} className="px-5 py-2.5 rounded-full text-[12.5px] font-semibold" style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.15)' }}>
              Join Waitlist →
            </button>
          </div>
          <div className="relative min-h-[260px] md:min-h-[380px] order-first md:order-last">
            <Image src="/images/mobius-card.jpg" alt="MÖBIUS Card" fill className="object-cover" />
            {/* Blend the image edges into the panel instead of showing a hard rectangle */}
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, transparent 35%, rgba(10,14,32,.6) 100%)' }} />
            <div className="hidden md:block absolute inset-y-0 left-0 w-28 pointer-events-none" style={{ background: 'linear-gradient(to right, rgba(20,24,58,.85), transparent)' }} />
            <div className="md:hidden absolute inset-x-0 top-0 h-16 pointer-events-none" style={{ background: 'linear-gradient(to bottom, rgba(20,24,58,.85), transparent)' }} />
          </div>
        </div>
      </section>

      {/* CREATOR FEE DELIVERY ENGINE */}
      <section className="max-w-[1240px] mx-auto px-4 sm:px-6 pb-20">
        <div className="rounded-3xl p-7 sm:p-9 md:p-12 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg,rgba(34,197,94,.05),rgba(76,96,241,.04))', border: '1px solid rgba(255,255,255,.07)' }}>
          <div className="grid md:grid-cols-[1fr_auto] gap-8 items-center">
            <div>
              <div className="text-[10.5px] font-bold tracking-[2.5px] uppercase mb-3" style={{ color: '#4ade80' }}>Free Delivery, Funded On-Chain</div>
              <h2 className="font-display font-extrabold text-[24px] sm:text-[28px] leading-tight mb-3">
                Every trade covers delivery for holders.
              </h2>
              <p className="text-white/55 text-[14.5px] leading-relaxed max-w-[520px]">
                A share of creator fees from every MÖBIUS trade flows straight into the Delivery Coverage Treasury —
                a public wallet anyone can audit. Eligible orders get their delivery fee paid from that pool automatically.
                No subscription, no catch — just hold MÖBIUS and shop.
              </p>
            </div>
            <div className="flex gap-3">
              {[
                { pct: '70%', label: 'Delivery Pool' },
                { pct: '20%', label: 'Operations' },
                { pct: '10%', label: 'Marketing' },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl px-5 py-4 text-center flex-1 md:flex-none md:w-28"
                  style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)' }}>
                  <div className="font-display font-extrabold text-xl" style={{ color: s.label === 'Delivery Pool' ? '#4ade80' : '#e2e5ef' }}>{s.pct}</div>
                  <div className="text-[9.5px] text-white/45 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* TRUST SECTION */}
      <section className="max-w-[1240px] mx-auto px-4 sm:px-6 pb-20">
        <div className="rounded-2xl p-6 grid grid-cols-2 md:grid-cols-4 gap-6" style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.06)' }}>
          {[
            { t: 'Real Products', d: 'Real product discovery and pricing.' },
            { t: 'One Payment Layer', d: 'A unified checkout experience.' },
            { t: 'Secure Wallet', d: 'Users remain in control.' },
            { t: 'Order Tracking', d: 'Track purchases to delivery.' },
          ].map((item) => (
            <div key={item.t}>
              <div className="font-bold text-[13px] mb-1">{item.t}</div>
              <div className="text-[11px] text-white/45 leading-snug">{item.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="max-w-[1240px] mx-auto px-4 sm:px-6 pb-20 text-center">
        <div className="rounded-3xl p-10 sm:p-14" style={{ background: 'linear-gradient(135deg,rgba(76,96,241,.1),rgba(168,85,247,.06))', border: '1px solid rgba(255,255,255,.08)' }}>
          <h2 className="font-display font-extrabold text-[24px] sm:text-[30px] mb-2">Ready to shop differently?</h2>
          <p className="text-white/50 text-[14.5px] mb-7">Your crypto shouldn&apos;t stop at the exchange.</p>
          <button onClick={() => document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' })} className="px-7 py-3.5 rounded-full text-[14px] font-bold text-white" style={{ background: 'linear-gradient(135deg,#4c60f1,#7b5cf0)' }}>
            Start Shopping →
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/[.06] px-4 sm:px-6 py-12" style={{ background: 'rgba(2,4,14,.6)' }}>
        <div className="max-w-[1240px] mx-auto grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-2">
              <Image src="/images/logo-footer.png" alt="" width={20} height={20} className="logo-glow" />
              <span className="font-display font-bold text-sm">MÖBIUS</span>
            </div>
            <div className="text-[11.5px] text-white/40">The crypto commerce layer.</div>
          </div>
          {[
            { h: 'Shop', links: ['All Products', 'Categories', 'Trending', 'Discover'] },
            { h: 'MÖBIUS', links: ['How It Works', 'MÖBIUS Card', 'About', 'Careers'] },
            { h: 'Support', links: ['Help Center', 'Track Order', 'FAQ', 'Contact'] },
            { h: 'Legal', links: ['Terms', 'Privacy', 'Cookies'] },
          ].map((col) => (
            <div key={col.h}>
              <div className="text-[11px] font-bold tracking-wide uppercase text-white/70 mb-3">{col.h}</div>
              {col.links.map((l) => (
                <a key={l} href="#" className="block text-[12px] text-white/40 hover:text-white/70 transition-colors mb-2">{l}</a>
              ))}
            </div>
          ))}
        </div>
        <div className="max-w-[1240px] mx-auto flex items-center justify-between flex-wrap gap-3 pt-6 border-t border-white/[.06] text-[11px] text-white/35">
          <span>© 2025 MÖBIUS. All rights reserved.</span>
          <div className="flex gap-4">
            <a href="https://x.com/Trymobius" target="_blank" rel="noopener noreferrer" className="hover:text-white/70 transition-colors">𝕏</a>
            <a href="#" className="hover:text-white/70 transition-colors">Discord</a>
            <a href="#" className="hover:text-white/70 transition-colors">Telegram</a>
          </div>
        </div>
      </footer>

      {/* PRODUCT DETAIL MODAL */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[300] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" style={{ background: 'rgba(10,14,32,.95)', border: '1px solid rgba(255,255,255,.1)' }}>
            <div className="p-6">
              <button onClick={() => setSelectedProduct(null)} className="float-right text-white/40 bg-transparent border-0 cursor-pointer">✕</button>
              <h2 className="font-display font-bold text-lg mb-2 pr-8">{selectedProduct.title}</h2>
              <div className="text-2xl font-extrabold font-display mb-1">${selectedProduct.price.amount.toLocaleString()}</div>
              <div className="text-[12px] mb-4" style={{ color: '#8b93ff' }}>≈ {(selectedProduct.price.amount / mobiusRate).toFixed(4)} MÖBIUS</div>
              <p className="text-sm text-white/50 mb-6">{selectedProduct.description || 'No description available.'}</p>
              <div className="flex gap-2">
                <button onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); }} className="flex-1 py-3 rounded-xl font-bold text-white" style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.15)' }}>
                  Add to Cart
                </button>
                <button disabled={!connected} onClick={() => attemptPay()} className="flex-1 py-3 rounded-xl font-bold text-white disabled:opacity-40" style={{ background: 'linear-gradient(135deg,#4c60f1,#7b5cf0)' }}>
                  {connected ? 'Buy with Crypto' : 'Connect wallet'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WAITLIST MODAL */}
      {waitlistOpen && (
        <div className="fixed inset-0 z-[300] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => { setWaitlistOpen(false); setWaitlistStatus('idle'); }}>
          <div onClick={(e) => e.stopPropagation()} className="rounded-2xl max-w-sm w-full p-7" style={{ background: 'rgba(10,14,32,.97)', border: '1px solid rgba(255,255,255,.1)' }}>
            <button onClick={() => { setWaitlistOpen(false); setWaitlistStatus('idle'); }} className="float-right text-white/40 bg-transparent border-0 cursor-pointer">✕</button>
            <h3 className="font-display font-bold text-lg mb-1">Join the MÖBIUS Card waitlist</h3>
            <p className="text-white/50 text-[13px] mb-5">Be first to know when it launches.</p>
            {waitlistStatus === 'done' ? (
              <div className="text-center py-4">
                <div className="text-2xl mb-2">✓</div>
                <div className="font-semibold text-[14px]">You&apos;re on the list.</div>
              </div>
            ) : (
              <form onSubmit={submitWaitlist} className="flex flex-col gap-3">
                <input
                  type="email" required value={waitlistEmail} onChange={(e) => setWaitlistEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="rounded-xl px-4 py-3 text-[14px] bg-white/5 border border-white/10 outline-none focus:border-white/25 transition-colors"
                />
                <button type="submit" disabled={waitlistStatus === 'loading'} className="py-3 rounded-xl font-bold text-white disabled:opacity-50" style={{ background: 'linear-gradient(135deg,#4c60f1,#7b5cf0)' }}>
                  {waitlistStatus === 'loading' ? 'Joining...' : 'Notify Me'}
                </button>
                {waitlistStatus === 'error' && <div className="text-[12px] text-red-400 text-center">Something went wrong — try again.</div>}
              </form>
            )}
          </div>
        </div>
      )}

      {countdownOpen && (
        <LaunchCountdownModal secondsRemaining={secondsRemaining} onClose={() => setCountdownOpen(false)} />
      )}

      <WalletModal />

      <style jsx global>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}
