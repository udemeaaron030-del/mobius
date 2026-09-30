import type { SubsidyEligibility, SubsidyConfig, SubsidyRecord, HolderStatus } from '@/types';

const DEFAULT_CONFIG: SubsidyConfig = {
  maxPerOrder: parseFloat(process.env.MAX_SUBSIDY_PER_ORDER || '25'),
  maxDailyTotal: parseFloat(process.env.MAX_DAILY_SUBSIDY || '5000'),
  maxMonthlyTotal: parseFloat(process.env.MAX_MONTHLY_SUBSIDY || '100000'),
  minOrderValue: parseFloat(process.env.MIN_ORDER_VALUE || '0'),
  minMobiusBalance: parseFloat(process.env.MIN_MOBIUS_BALANCE || '1000'),
  eligibleMarketplaces: (process.env.ELIGIBLE_MARKETPLACES || 'all') === 'all' ? 'all' : (process.env.ELIGIBLE_MARKETPLACES || '').split(','),
  eligibleCountries: (process.env.ELIGIBLE_COUNTRIES || 'all') === 'all' ? 'all' : (process.env.ELIGIBLE_COUNTRIES || '').split(','),
};

// In production this would be database-backed
const subsidyRecords: SubsidyRecord[] = [];
let emergencyStop = false;

export function getConfig(): SubsidyConfig {
  return { ...DEFAULT_CONFIG };
}

export function setEmergencyStop(stopped: boolean): void {
  emergencyStop = stopped;
}

export function isEmergencyStopped(): boolean {
  return emergencyStop;
}

function getDailySpent(): number {
  const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
  return subsidyRecords.filter(r => r.timestamp >= startOfDay.getTime() && r.status === 'applied')
    .reduce((sum, r) => sum + r.coveredAmount, 0);
}

function getMonthlySpent(): number {
  const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);
  return subsidyRecords.filter(r => r.timestamp >= startOfMonth.getTime() && r.status === 'applied')
    .reduce((sum, r) => sum + r.coveredAmount, 0);
}

export function checkEligibility(
  deliveryFee: number,
  orderValue: number,
  marketplace: string,
  holder: HolderStatus,
  country?: string
): SubsidyEligibility {
  const config = getConfig();

  if (emergencyStop) return { eligible: false, deliveryFee, coveredAmount: 0, userPays: deliveryFee, reason: 'Delivery coverage temporarily paused' };
  if (!holder.connected) return { eligible: false, deliveryFee, coveredAmount: 0, userPays: deliveryFee, reason: 'Wallet not connected' };
  if (holder.mobiusBalance < config.minMobiusBalance) return { eligible: false, deliveryFee, coveredAmount: 0, userPays: deliveryFee, reason: `Hold ${config.minMobiusBalance}+ MÖBIUS to qualify` };
  if (orderValue < config.minOrderValue) return { eligible: false, deliveryFee, coveredAmount: 0, userPays: deliveryFee, reason: `Minimum order value: $${config.minOrderValue}` };
  if (config.eligibleMarketplaces !== 'all' && !config.eligibleMarketplaces.includes(marketplace)) return { eligible: false, deliveryFee, coveredAmount: 0, userPays: deliveryFee, reason: 'Marketplace not eligible' };
  if (country && config.eligibleCountries !== 'all' && !config.eligibleCountries.includes(country)) return { eligible: false, deliveryFee, coveredAmount: 0, userPays: deliveryFee, reason: 'Country not eligible' };
  if (deliveryFee <= 0) return { eligible: true, deliveryFee: 0, coveredAmount: 0, userPays: 0 };
  if (getDailySpent() + deliveryFee > config.maxDailyTotal) return { eligible: false, deliveryFee, coveredAmount: 0, userPays: deliveryFee, reason: 'Daily coverage limit reached' };
  if (getMonthlySpent() + deliveryFee > config.maxMonthlyTotal) return { eligible: false, deliveryFee, coveredAmount: 0, userPays: deliveryFee, reason: 'Monthly coverage limit reached' };

  const covered = Math.min(deliveryFee, config.maxPerOrder);
  return { eligible: true, deliveryFee, coveredAmount: covered, userPays: deliveryFee - covered };
}

export function applySubsidy(orderId: string, userId: string, walletAddress: string, marketplace: string, deliveryFee: number, coveredAmount: number): SubsidyRecord | null {
  // Double-subsidy prevention
  if (subsidyRecords.some(r => r.orderId === orderId && r.status === 'applied')) return null;

  const record: SubsidyRecord = {
    id: `SUB-${crypto.randomUUID().slice(0, 8)}`,
    orderId, userId, walletAddress, marketplace,
    deliveryFee, coveredAmount,
    source: 'creator_fees',
    timestamp: Date.now(),
    status: 'applied',
  };
  subsidyRecords.push(record);
  return record;
}

export function getSubsidyRecords(): SubsidyRecord[] { return [...subsidyRecords]; }
export function getPoolStats() {
  return { dailySpent: getDailySpent(), monthlySpent: getMonthlySpent(), totalRecords: subsidyRecords.length };
}
