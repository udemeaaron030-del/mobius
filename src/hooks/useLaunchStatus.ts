'use client';

import { useState, useEffect } from 'react';

interface LaunchStatus {
  launched: boolean;
  enabled: boolean;
  buyingEnabledAt: number | null;
}

export function useLaunchStatus() {
  const [status, setStatus] = useState<LaunchStatus>({ launched: false, enabled: false, buyingEnabledAt: null });
  const [secondsRemaining, setSecondsRemaining] = useState(0);

  useEffect(() => {
    let mounted = true;
    fetch('/api/token/launch-status')
      .then((r) => r.json())
      .then((data) => { if (mounted && data.success) setStatus(data.data); })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!status.launched || status.enabled || !status.buyingEnabledAt) return;

    const tick = () => {
      const remaining = Math.max(0, Math.floor((status.buyingEnabledAt! - Date.now()) / 1000));
      setSecondsRemaining(remaining);
      if (remaining === 0) setStatus((s) => ({ ...s, enabled: true }));
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [status.launched, status.enabled, status.buyingEnabledAt]);

  return { ...status, secondsRemaining };
}
