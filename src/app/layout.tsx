import type { Metadata } from 'next';
import './globals.css';
import MobiusWalletProvider from '@/components/wallet/WalletProvider';

export const metadata: Metadata = {
  title: 'MÖBIUS — Hold MÖBIUS. Shop Anywhere.',
  description: 'The crypto commerce layer. Hold MÖBIUS, shop connected marketplaces, pay with MÖBIUS.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <MobiusWalletProvider>
          {children}
        </MobiusWalletProvider>
      </body>
    </html>
  );
}
