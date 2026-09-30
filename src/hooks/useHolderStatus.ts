'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import type { HolderStatus } from '@/types';

export function useHolderStatus() {
  const { publicKey, connected } = useWallet();
  const [status, setStatus] = useState<HolderStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [configured, setConfigured] = useState(false);

  const verify = useCallback(async () => {
    if (!connected || !publicKey) {
      setStatus(null);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/holder/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: publicKey.toString() }),
      });
      const data = await response.json();
      if (data.success) {
        setStatus(data.data);
        setConfigured(data.configured);
      }
    } catch (err) {
      console.error('Holder verification failed:', err);
    } finally {
      setLoading(false);
    }
  }, [connected, publicKey]);

  useEffect(() => { verify(); }, [verify]);

  return { status, loading, configured, refresh: verify };
}
