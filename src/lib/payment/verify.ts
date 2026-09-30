import { Connection, PublicKey } from '@solana/web3.js';
import type { PaymentVerification } from '@/types';

function getConfig() {
  return {
    rpcUrl: process.env.RPC_URL || 'https://api.mainnet-beta.solana.com',
    tokenMint: process.env.MOBIUS_TOKEN_MINT || '',
    treasuryAddress: process.env.MOBIUS_TREASURY_ADDRESS || '',
    network: process.env.MOBIUS_NETWORK || 'mainnet-beta',
  };
}

export function isPaymentConfigured(): boolean {
  const c = getConfig();
  return !!(c.tokenMint && c.treasuryAddress);
}

export async function verifyTransaction(
  signature: string,
  expectedAmount: number,
  expectedSender: string
): Promise<PaymentVerification> {
  const config = getConfig();

  if (!isPaymentConfigured()) {
    return { valid: false, signature, sender: '', recipient: '', amount: 0, tokenMint: '', confirmed: false, error: 'Payment infrastructure not configured. Set MOBIUS_TOKEN_MINT and MOBIUS_TREASURY_ADDRESS.' };
  }

  try {
    const connection = new Connection(config.rpcUrl, 'confirmed');
    const tx = await connection.getParsedTransaction(signature, { maxSupportedTransactionVersion: 0 });

    if (!tx) return { valid: false, signature, sender: '', recipient: '', amount: 0, tokenMint: '', confirmed: false, error: 'Transaction not found' };
    if (tx.meta?.err) return { valid: false, signature, sender: '', recipient: '', amount: 0, tokenMint: '', confirmed: false, error: 'Transaction failed on chain' };

    // Parse SPL token transfer
    const instructions = tx.transaction.message.instructions;
    let sender = '', recipient = '', amount = 0, tokenMint = '';

    for (const ix of instructions) {
      if ('parsed' in ix && ix.program === 'spl-token') {
        const parsed = ix.parsed;
        if (parsed.type === 'transfer' || parsed.type === 'transferChecked') {
          sender = parsed.info.authority || parsed.info.source || '';
          recipient = parsed.info.destination || '';
          amount = parsed.info.amount ? Number(parsed.info.amount) : (parsed.info.tokenAmount?.uiAmount || 0);
          tokenMint = parsed.info.mint || config.tokenMint;
        }
      }
    }

    // Verify recipient matches treasury
    const recipientMatch = recipient === config.treasuryAddress ||
      tx.meta?.postTokenBalances?.some(b => b.owner === config.treasuryAddress);

    // Verify token mint
    const mintMatch = tokenMint === config.tokenMint ||
      tx.meta?.postTokenBalances?.some(b => b.mint === config.tokenMint);

    // Verify sender
    const senderMatch = sender === expectedSender ||
      tx.transaction.message.accountKeys.some(k =>
        ('pubkey' in k ? k.pubkey.toString() : k.toString()) === expectedSender
      );

    const valid = recipientMatch && mintMatch && senderMatch && amount >= expectedAmount;

    return {
      valid,
      signature,
      sender,
      recipient,
      amount,
      tokenMint,
      confirmed: true,
      slot: tx.slot,
      error: valid ? undefined : `Verification failed: recipient=${recipientMatch}, mint=${mintMatch}, sender=${senderMatch}, amount=${amount >= expectedAmount}`,
    };
  } catch (err) {
    return { valid: false, signature, sender: '', recipient: '', amount: 0, tokenMint: '', confirmed: false, error: err instanceof Error ? err.message : 'Verification error' };
  }
}

export async function getTokenBalance(walletAddress: string): Promise<number> {
  const config = getConfig();
  if (!config.tokenMint || !config.rpcUrl) return 0;

  try {
    const connection = new Connection(config.rpcUrl, 'confirmed');
    const wallet = new PublicKey(walletAddress);
    const mint = new PublicKey(config.tokenMint);
    const accounts = await connection.getParsedTokenAccountsByOwner(wallet, { mint });
    return accounts.value.reduce((sum, acc) => sum + (acc.account.data.parsed.info.tokenAmount.uiAmount || 0), 0);
  } catch { return 0; }
}
