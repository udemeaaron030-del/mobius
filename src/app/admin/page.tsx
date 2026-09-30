'use client';

import { useState, useEffect, useCallback } from 'react';

export default function AdminPage() {
  const [secret, setSecret] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [status, setStatus] = useState<{ launchTimestamp: number | null } | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchStatus = useCallback(async (s: string) => {
    const res = await fetch('/api/admin/launch', { headers: { 'x-admin-secret': s } });
    const data = await res.json();
    if (data.success) {
      setStatus(data.data);
      setUnlocked(true);
    } else {
      setMessage(data.error || 'Failed to authenticate');
    }
  }, []);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStatus(secret);
  };

  const handleLaunch = async () => {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin/launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success) {
        setStatus(data.data);
        setMessage('Launch time set. The countdown is live for everyone right now.');
      } else {
        setMessage(data.error || 'Failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin/launch', { method: 'DELETE', headers: { 'x-admin-secret': secret } });
      const data = await res.json();
      if (data.success) {
        setStatus({ launchTimestamp: null });
        setMessage('Launch time cleared. Buying is unrestricted again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const lockHours = parseFloat(process.env.NEXT_PUBLIC_BUY_LOCK_HOURS || '3');
  const unlockAt = status?.launchTimestamp ? status.launchTimestamp + lockHours * 3600 * 1000 : null;
  const isLive = unlockAt ? Date.now() < unlockAt : false;

  if (!unlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#020510' }}>
        <form onSubmit={handleUnlock} className="w-full max-w-sm rounded-2xl p-7" style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)' }}>
          <h1 className="text-white font-bold text-lg mb-1">MÖBIUS Admin</h1>
          <p className="text-white/40 text-[13px] mb-5">Enter the admin secret to continue.</p>
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="Admin secret"
            className="w-full rounded-xl px-4 py-3 text-[14px] bg-white/5 border border-white/10 outline-none text-white mb-3"
          />
          <button type="submit" className="w-full py-3 rounded-xl font-bold text-white" style={{ background: 'linear-gradient(135deg,#4c60f1,#7b5cf0)' }}>
            Unlock
          </button>
          {message && <p className="text-red-400 text-[12px] mt-3 text-center">{message}</p>}
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-16" style={{ background: '#020510' }}>
      <div className="max-w-lg mx-auto rounded-2xl p-8" style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)' }}>
        <h1 className="text-white font-bold text-xl mb-1">Token Launch Control</h1>
        <p className="text-white/40 text-[13px] mb-8">Controls the buying lock countdown shown to every visitor.</p>

        <div className="rounded-xl p-5 mb-6" style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)' }}>
          <div className="text-white/40 text-[11px] uppercase tracking-wide mb-1">Current Status</div>
          {!status?.launchTimestamp ? (
            <div className="text-white font-semibold">Not launched yet — buying is fully open</div>
          ) : isLive ? (
            <div className="text-yellow-400 font-semibold">
              Countdown active — unlocks {new Date(unlockAt!).toLocaleString()}
            </div>
          ) : (
            <div className="text-green-400 font-semibold">Launched — buying lock has expired, purchases enabled</div>
          )}
          {status?.launchTimestamp && (
            <div className="text-white/40 text-[12px] mt-2">Launched at: {new Date(status.launchTimestamp).toLocaleString()}</div>
          )}
        </div>

        <button
          onClick={handleLaunch}
          disabled={loading}
          className="w-full py-4 rounded-xl font-bold text-white mb-3 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg,#4c60f1,#7b5cf0,#a44bf7)' }}
        >
          {loading ? 'Working...' : '🚀 Launch Now'}
        </button>
        <button
          onClick={handleReset}
          disabled={loading}
          className="w-full py-3 rounded-xl font-semibold text-white/70 disabled:opacity-50"
          style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)' }}
        >
          Clear / Reset
        </button>

        {message && <p className="text-white/70 text-[13px] mt-4 text-center">{message}</p>}

        <p className="text-white/30 text-[11.5px] mt-6 leading-relaxed">
          Clicking &quot;Launch Now&quot; starts the {lockHours}-hour buying lock from this exact moment. Every visitor sees
          the live countdown immediately — no server restart needed.
        </p>
      </div>
    </div>
  );
}
