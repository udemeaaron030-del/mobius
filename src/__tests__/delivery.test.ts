import { checkEligibility, getConfig } from '@/lib/delivery/subsidy';
import type { HolderStatus } from '@/types';

describe('Delivery Subsidy Engine', () => {
  const connectedHolder: HolderStatus = {
    wallet: 'test123', connected: true, mobiusBalance: 5000,
    eligible: true, tier: 'holder', minimumRequired: 1000,
  };

  const disconnectedHolder: HolderStatus = {
    wallet: '', connected: false, mobiusBalance: 0,
    eligible: false, tier: 'none', minimumRequired: 1000,
  };

  const lowBalanceHolder: HolderStatus = {
    wallet: 'test456', connected: true, mobiusBalance: 100,
    eligible: false, tier: 'none', minimumRequired: 1000,
  };

  test('eligible holder gets full coverage within limit', () => {
    const result = checkEligibility(10, 100, 'amazon', connectedHolder);
    expect(result.eligible).toBe(true);
    expect(result.coveredAmount).toBe(10);
    expect(result.userPays).toBe(0);
  });

  test('delivery fee above max is partially covered', () => {
    const result = checkEligibility(50, 100, 'amazon', connectedHolder);
    expect(result.eligible).toBe(true);
    expect(result.coveredAmount).toBe(25); // max per order
    expect(result.userPays).toBe(25);
  });

  test('disconnected wallet is not eligible', () => {
    const result = checkEligibility(10, 100, 'amazon', disconnectedHolder);
    expect(result.eligible).toBe(false);
    expect(result.reason).toContain('not connected');
  });

  test('low balance is not eligible', () => {
    const result = checkEligibility(10, 100, 'amazon', lowBalanceHolder);
    expect(result.eligible).toBe(false);
    expect(result.reason).toContain('MÖBIUS');
  });

  test('zero delivery fee returns eligible with zero coverage', () => {
    const result = checkEligibility(0, 100, 'amazon', connectedHolder);
    expect(result.eligible).toBe(true);
    expect(result.coveredAmount).toBe(0);
    expect(result.userPays).toBe(0);
  });
});
