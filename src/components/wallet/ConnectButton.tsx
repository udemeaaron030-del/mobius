'use client';

import { useMobiusWallet } from './WalletProvider';

export default function ConnectButton() {
  const { connected, connecting, publicKey, openModal, disconnect } = useMobiusWallet();

  const shortenAddress = (addr: string) => `${addr.slice(0, 4)}...${addr.slice(-3)}`;

  return (
    <button
      onClick={connected ? disconnect : openModal}
      disabled={connecting}
      className={`
        px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200
        ${connected
          ? 'bg-[rgba(76,96,241,.1)] border border-[rgba(76,96,241,.2)] text-white'
          : 'text-white shadow-[0_0_14px_rgba(76,96,241,.25)]'
        }
        hover:shadow-[0_0_24px_rgba(76,96,241,.35)] hover:-translate-y-[1px]
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
      style={!connected ? { background: 'linear-gradient(135deg,#4c60f1,#7b5cf0,#a44bf7)' } : undefined}
    >
      {connecting ? 'Connecting...' : connected && publicKey ? shortenAddress(publicKey) : 'Connect Wallet'}
    </button>
  );
}
