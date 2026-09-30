'use client';

import { useState, useEffect } from 'react';

export function useTokenPrice() {
  const [price, setPrice] = useState(0.042); // sensible default until first fetch resolves
  const [configured, setConfigured] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function fetchPrice() {
      try {
        const res = await fetch('/api/token/price');
        const data = await res.json();
        if (mounted && data.success) {
          setPrice(data.data.price);
          setConfigured(data.data.configured);
        }
      } catch {
        // keep last known price on failure
      }
    }

    fetchPrice();
    const interval = setInterval(fetchPrice, 30000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  return { price, configured };
}
