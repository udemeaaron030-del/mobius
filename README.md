# MÖBIUS — The Crypto Commerce Layer

Hold MÖBIUS. Shop Anywhere. Pay with MÖBIUS.

## Architecture

```
MÖBIUS Frontend (Next.js 14)
       │
  ┌────┴────┐
Wallet    Search
(Solana)     │
       Marketplace API Layer
            │
       AliExpress
    (shown generically as
      "Marketplace")
            │
    Normalized Products
            │
       Checkout
            │
    Payment Quote (server-signed)
            │
    Holder Verification (on-chain)
            │
    MÖBIUS Token Payment (SPL transfer)
            │
    Blockchain Verification (server-side)
            │
       Order Created
            │
    Merchant Fulfillment
            │
    Delivery Subsidy (if eligible)
```

## Setup

```bash
npm install
cp .env.example .env.local
# Fill in your API credentials
npm run dev
```

## Getting Your AliExpress Access Token (Required — One-Time Setup)

The AliExpress Dropshipping API needs more than just an App Key/Secret —
it requires an OAuth access token before any product search will work.

1. Make sure your app's **App Status** shows **"production"** (confirmed
   as "Online" in your console — you're good here).

2. Visit this URL in your browser (replace `YOUR_APP_KEY` and
   `YOUR_CALLBACK_URL` with your actual values):
   ```
   https://api-sg.aliexpress.com/oauth/authorize?response_type=code&force_auth=true&redirect_uri=YOUR_CALLBACK_URL&client_id=YOUR_APP_KEY
   ```

3. Log in and approve. You'll be redirected to your callback URL with a
   `?code=...` parameter in the address bar — copy everything after `code=`.
   **This code expires within a few minutes, so do the next step immediately.**

4. Run:
   ```bash
   npm install
   node scripts/get-access-token.mjs
   ```
   Paste the code when prompted. It prints your `ALIEXPRESS_ACCESS_TOKEN` —
   copy that into `.env.local`.

   This script uses the `ae_sdk` package, which correctly implements
   AliExpress's request signing. (An earlier version of this project tried
   to hand-roll the signature — AliExpress's signing scheme has a subtlety
   most guides get wrong: for path-style endpoints like `/auth/token/create`,
   the method path itself must be included as part of what gets signed, and
   parameters go in the URL query string rather than the POST body. Using
   a real SDK avoids re-discovering that the hard way.)

5. Restart your dev server after updating `.env.local`.

## Required Credentials

| Service | Variables | How to Get |
|---------|-----------|------------|
| Amazon | `AMAZON_ACCESS_KEY`, `AMAZON_SECRET_KEY`, `AMAZON_PARTNER_TAG` | [Amazon Associates](https://affiliate-program.amazon.com/) + PA-API access |
| eBay | `EBAY_CLIENT_ID`, `EBAY_CLIENT_SECRET` | [eBay Developer Program](https://developer.ebay.com/) |
| Walmart | `WALMART_CLIENT_ID`, `WALMART_CLIENT_SECRET` | [Walmart Developer](https://developer.walmart.com/) (requires approved access) |
| Solana | `MOBIUS_TOKEN_MINT`, `MOBIUS_TREASURY_ADDRESS` | Your MÖBIUS SPL token mint and treasury wallet |
| RPC | `RPC_URL` | [Helius](https://helius.dev/), [QuickNode](https://quicknode.com/), or public Solana RPC |

## Marketplace Status

Each marketplace shows one of:
- **CONNECTED** — credentials valid, API responding
- **CONFIGURATION REQUIRED** — credentials missing
- **UNAVAILABLE** — API down or access not approved
- **ERROR** — API error

No fake data is ever shown. If a marketplace is not configured, it says so.

## Wallet

Wallet does NOT auto-connect. The user must:
1. Click "Connect Wallet"
2. Select their wallet (Phantom, Solflare, Backpack)
3. Approve the connection in their wallet

No seed phrases or private keys are ever requested or stored.

## Delivery Subsidy

Configurable via environment variables:
- `MAX_SUBSIDY_PER_ORDER` — max coverage per order
- `MAX_DAILY_SUBSIDY` — daily pool limit
- `MIN_MOBIUS_BALANCE` — minimum holdings to qualify
- `ELIGIBLE_MARKETPLACES` — which stores qualify
- `ELIGIBLE_COUNTRIES` — which countries qualify

Not all deliveries are free. The system calculates eligibility per order.

## Testing

```bash
npm test
```

## Deploy to Vercel

1. Push to GitHub
2. Import in Vercel
3. Add all env vars from `.env.example`
4. Deploy

## Vercel Environment Variables

Add these in Vercel dashboard → Settings → Environment Variables:

```
AMAZON_ACCESS_KEY=your_key
AMAZON_SECRET_KEY=your_secret
AMAZON_PARTNER_TAG=your_tag
EBAY_CLIENT_ID=your_id
EBAY_CLIENT_SECRET=your_secret
WALMART_CLIENT_ID=your_id
WALMART_CLIENT_SECRET=your_secret
MOBIUS_TOKEN_MINT=your_mint
MOBIUS_TREASURY_ADDRESS=your_treasury
MOBIUS_NETWORK=mainnet-beta
RPC_URL=your_rpc_url
QUOTE_SIGNING_SECRET=your_random_secret
```
