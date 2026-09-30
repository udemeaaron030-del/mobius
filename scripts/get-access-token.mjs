#!/usr/bin/env node
/**
 * MÖBIUS — AliExpress Access Token Exchange
 *
 * Run this once to convert your OAuth authorization code into an
 * access token, using the ae_sdk package (handles AliExpress's
 * request signing correctly).
 *
 * Usage:
 *   node scripts/get-access-token.mjs
 */

import { createHmac, createHash } from 'crypto';
import { readFileSync, existsSync } from 'fs';

function loadEnvLocal() {
  const envPath = '.env.local';
  if (!existsSync(envPath)) {
    console.error('❌ .env.local not found. Run this from your project root (where package.json is).');
    process.exit(1);
  }
  const content = readFileSync(envPath, 'utf8');
  const env = {};
  for (const line of content.split('\n')) {
    const match = line.match(/^([A-Z_]+)=(.*)$/);
    if (match) env[match[1]] = match[2].trim();
  }
  return env;
}

// Replicates ae_sdk's request construction exactly, but lets us control
// the sign_method LABEL sent to the server independently of the actual
// hashing algorithm used — the ae_sdk package hardcodes "sha256" as the
// label, but AliExpress's own docs say valid values are "hmac" or "md5".
// AliExpress requires the timestamp as "yyyy-MM-dd HH:mm:ss" in GMT+8,
// not a raw millisecond epoch number (a subtlety documented in AliExpress's
// own API docs but not implemented correctly in some third-party SDKs).
function getTimestamp() {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const gmt8 = new Date(utcMs + 8 * 3600000);
  const pad = (n) => String(n).padStart(2, '0');
  return `${gmt8.getFullYear()}-${pad(gmt8.getMonth() + 1)}-${pad(gmt8.getDate())} ${pad(gmt8.getHours())}:${pad(gmt8.getMinutes())}:${pad(gmt8.getSeconds())}`;
}

function buildRequest(method, params, appKey, appSecret, signMethodLabel, hashAlgo) {
  const p = { ...params, method, app_key: appKey, simplify: true, sign_method: signMethodLabel, timestamp: getTimestamp() };

  let basestring = '';
  const signParams = { ...p };
  if (typeof signParams.method === 'string' && signParams.method.includes('/')) {
    basestring = signParams.method;
    delete signParams.method;
  }
  basestring += Object.entries(signParams)
    .filter(([, v]) => v != null)
    .sort(([a], [b]) => a.localeCompare(b))
    .reduce((acc, [k, v]) => acc + k + String(v), '');

  let sign;
  if (hashAlgo === 'md5') {
    sign = createHash('md5').update(`${appSecret}${basestring}${appSecret}`, 'utf8').digest('hex').toUpperCase();
  } else {
    sign = createHmac('sha256', appSecret).update(basestring, 'utf8').digest('hex').toUpperCase();
  }
  p.sign = sign;

  const baseUrl = method.includes('/') ? `https://api-sg.aliexpress.com/rest${method}` : 'https://api-sg.aliexpress.com/sync';
  const q = { ...p };
  if (q.method && q.method.includes('/')) delete q.method;
  const queryString = Object.entries(q)
    .filter(([, v]) => v != null)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&');

  return `${baseUrl}?${queryString}`;
}

async function tryExchange(code, appKey, appSecret, label, algo) {
  const url = buildRequest('/auth/token/create', { code }, appKey, appSecret, label, algo);
  const response = await fetch(url, { method: 'POST' });
  const data = await response.json();
  return data;
}

async function main() {
  const env = loadEnvLocal();
  const appKey = env.ALIEXPRESS_APP_KEY;
  const appSecret = env.ALIEXPRESS_APP_SECRET;

  if (!appKey || !appSecret) {
    console.error('❌ ALIEXPRESS_APP_KEY or ALIEXPRESS_APP_SECRET missing in .env.local');
    process.exit(1);
  }

  const code = process.argv[2];
  if (!code) {
    console.error('❌ No code provided.\n');
    console.error('Usage: node scripts/get-access-token.mjs YOUR_CODE_HERE');
    process.exit(1);
  }

  // Try both sign_method labels AliExpress's own docs mention as valid,
  // since the exact one required isn't confirmed. Same code can be reused
  // across these attempts as long as none of them succeed (a signature
  // rejection happens before the code itself is consumed).
  const attempts = [
    { label: 'hmac', algo: 'hmac' },
    { label: 'md5', algo: 'md5' },
  ];

  for (const { label, algo } of attempts) {
    console.log(`\n⏳ Trying sign_method="${label}"...\n`);
    const data = await tryExchange(code, appKey, appSecret, label, algo);

    if (data.access_token) {
      console.log(`✅ Success with sign_method="${label}"! Add these to your .env.local:\n`);
      console.log(`ALIEXPRESS_ACCESS_TOKEN=${data.access_token}`);
      if (data.refresh_token) console.log(`ALIEXPRESS_REFRESH_TOKEN=${data.refresh_token}`);
      console.log('');
      return;
    }

    console.log(`   Failed: ${data.message || data.code || 'unknown error'}`);
  }

  console.error('\n❌ All signing methods failed. Full response from the last attempt:\n');
  const lastAttempt = await tryExchange(code, appKey, appSecret, attempts[attempts.length - 1].label, attempts[attempts.length - 1].algo);
  console.error(JSON.stringify(lastAttempt, null, 2));
  console.error('\nThe code may have expired — try getting a completely fresh one.');
}

main();
