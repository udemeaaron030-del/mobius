'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

// ═══════════════════════════════════════════════════
// MÖBIUS — Self-Contained Wallet Connector
//
// Built directly on top of the standard injected provider APIs that
// Phantom and Solflare both expose (window.phantom.solana / window.solflare).
// This intentionally avoids @solana/wallet-adapter-react-ui, whose modal
// component repeatedly failed to open reliably in this project due to
// dependency-resolution conflicts in its wider ecosystem. Fewer moving
// parts here means fewer places for that kind of bug to hide.
//
// Never auto-connects. Never touches seed phrases or private keys —
// only ever calls the wallet's own connect()/disconnect() methods.
// ═══════════════════════════════════════════════════

interface DetectedWallet {
  name: string;
  installed: boolean;
  installUrl: string;
  provider: any;
}

interface WalletContextValue {
  connected: boolean;
  connecting: boolean;
  publicKey: string | null;
  walletName: string | null;
  modalOpen: boolean;
  wallets: DetectedWallet[];
  openModal: () => void;
  closeModal: () => void;
  connectTo: (wallet: DetectedWallet) => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export function useMobiusWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useMobiusWallet must be used within MobiusWalletProvider');
  return ctx;
}

function detectWallets(): DetectedWallet[] {
  if (typeof window === 'undefined') return [];

  const phantomProvider = (window as any).phantom?.solana;
  const solflareProvider = (window as any).solflare;

  return [
    {
      name: 'Phantom',
      installed: !!phantomProvider?.isPhantom,
      installUrl: 'https://phantom.app/download',
      provider: phantomProvider,
    },
    {
      name: 'Solflare',
      installed: !!solflareProvider?.isSolflare,
      installUrl: 'https://solflare.com/download',
      provider: solflareProvider,
    },
  ];
}

export default function MobiusWalletProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [walletName, setWalletName] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [wallets, setWallets] = useState<DetectedWallet[]>([]);
  const [activeProvider, setActiveProvider] = useState<any>(null);

  useEffect(() => {
    // Wallet extensions inject themselves shortly after page load
    setWallets(detectWallets());
    const t = setTimeout(() => setWallets(detectWallets()), 500);
    return () => clearTimeout(t);
  }, []);

  const openModal = useCallback(() => {
    setWallets(detectWallets());
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => setModalOpen(false), []);

  const connectTo = useCallback(async (wallet: DetectedWallet) => {
    if (!wallet.installed || !wallet.provider) {
      window.open(wallet.installUrl, '_blank');
      return;
    }

    setConnecting(true);
    try {
      // This is the wallet's own approval popup — the user explicitly
      // approves in their own extension. Never a signature request,
      // never a request for keys or seed phrases.
      const response = await wallet.provider.connect();
      const pk = response?.publicKey?.toString() || wallet.provider.publicKey?.toString();

      if (pk) {
        setPublicKey(pk);
        setConnected(true);
        setWalletName(wallet.name);
        setActiveProvider(wallet.provider);
        setModalOpen(false);
      }
    } catch (err) {
      // User rejected the connection in their wallet — leave disconnected
      console.log('Wallet connection was not approved.');
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    try {
      activeProvider?.disconnect?.();
    } catch {}
    setConnected(false);
    setPublicKey(null);
    setWalletName(null);
    setActiveProvider(null);
  }, [activeProvider]);

  return (
    <WalletContext.Provider value={{ connected, connecting, publicKey, walletName, modalOpen, wallets, openModal, closeModal, connectTo, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
}
