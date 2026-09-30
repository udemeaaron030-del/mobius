'use client';

import { useMobiusWallet } from './WalletProvider';

export default function WalletModal() {
  const { modalOpen, closeModal, wallets, connectTo, connecting } = useMobiusWallet();

  if (!modalOpen) return null;

  return (
    <div className="fixed inset-0 z-[500] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={closeModal}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="rounded-2xl max-w-sm w-full p-6"
        style={{ background: 'rgba(10,14,32,.97)', border: '1px solid rgba(255,255,255,.1)' }}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display font-bold text-base">Connect a wallet</h3>
          <button onClick={closeModal} className="text-white/40 bg-transparent border-0 cursor-pointer">✕</button>
        </div>

        <div className="space-y-2">
          {wallets.map((wallet) => (
            <button
              key={wallet.name}
              onClick={() => connectTo(wallet)}
              disabled={connecting}
              className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-colors disabled:opacity-50"
              style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)' }}
            >
              <span className="text-[14px] font-semibold">{wallet.name}</span>
              <span className="text-[11px] font-medium" style={{ color: wallet.installed ? '#4ade80' : 'rgba(255,255,255,.4)' }}>
                {wallet.installed ? (connecting ? 'Connecting...' : 'Detected') : 'Install →'}
              </span>
            </button>
          ))}
        </div>

        <p className="text-[11px] text-white/35 text-center mt-5 leading-relaxed">
          MÖBIUS never asks for your seed phrase or private key. You approve every connection directly in your wallet.
        </p>
      </div>
    </div>
  );
}
