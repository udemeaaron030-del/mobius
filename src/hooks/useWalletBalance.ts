'use client';

import { useState, useEffect } from 'react';
import { useMobiusWallet } from '@/components/wallet/WalletProvider';

export function useWalletBalance() {
  const { publicKey, connected } = useMobiusWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [eligible, setEligible] = useState(false);
  const [minRequired, setMinRequired] = useState(1000);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!connected || !publicKey) {
      setBalance(null);
      setEligible(false);
      return;
    }

    let mounted = true;
    setLoading(true);

    fetch('/api/holder/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress: publicKey }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (mounted && data.success) {
          setBalance(data.data.mobiusBalance);
          setEligible(data.data.eligible);
          setMinRequired(data.data.minimumRequired);
        }
      })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false); });

    return () => { mounted = false; };
  }, [connected, publicKey]);

  return { balance, eligible, minRequired, loading, connected };
}
