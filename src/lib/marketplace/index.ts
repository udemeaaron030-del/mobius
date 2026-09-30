import { registry } from './registry';
import { EbayProvider } from './providers/ebay';

// ═══════════════════════════════════════════════════
// MÖBIUS — Marketplace Provider Registry
//
// Active provider: eBay (Browse API), presented to end users
// generically as "Marketplace" per product decision.
//
// AliExpress integration code remains in ./providers/aliexpress.ts
// for future use if its signature issue gets resolved (e.g. via
// AliExpress support) — just swap the import below to re-enable it.
//
// To add another marketplace later, create a new file in ./providers/
// implementing the MarketplaceProvider interface and register it below.
// ═══════════════════════════════════════════════════

registry.register(new EbayProvider());

export { registry };
