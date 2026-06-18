// Regenerates ../sold.js from Stripe — a print is "sold" when its payment link
// is deactivated or has reached its completed-sessions limit.
// Run by .github/workflows/sync-sold.yml hourly. Needs env STRIPE_API_KEY
// (a restricted, read-only "Payment Links: Read" key).
import { writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const KEY = process.env.STRIPE_API_KEY;
if (!KEY) {
  // Not configured yet — skip quietly so the scheduled job doesn't fail/email.
  console.log('STRIPE_API_KEY not set — skipping sync. Add the repo secret to enable.');
  process.exit(0);
}

// Stripe payment-link URL -> photo id (must match photo.html purchaseLinks)
const URL_TO_ID = {
  'https://buy.stripe.com/8x2eV62FUciNgx16HK3ZK0c': 1,
  'https://buy.stripe.com/00w4gsa8m1E93Kfeac3ZK04': 2,
  'https://buy.stripe.com/3cI5kweoC3MhcgL1nq3ZK0g': 3,
  'https://buy.stripe.com/6oU7sE6WafuZ2Gb9TW3ZK0d': 4,
  'https://buy.stripe.com/14A28kcgudmRbcH1nq3ZK0a': 5,
  'https://buy.stripe.com/5kQ00c3JYaaFgx1feg3ZK0e': 6,
  'https://buy.stripe.com/14AdR2fsG96B94zd683ZK05': 7,
  'https://buy.stripe.com/4gM9AMcgu82xgx11nq3ZK01': 8,
  'https://buy.stripe.com/cNifZagwK4QlcgL7LO3ZK08': 9,
  'https://buy.stripe.com/28EeV680e3Mh94zaY03ZK09': 10,
  'https://buy.stripe.com/aFacMYcgudmRa8D7LO3ZK07': 11,
  'https://buy.stripe.com/dRm4gs0xMaaFeoT0jm3ZK06': 12,
  'https://buy.stripe.com/fZu6oAa8m96Bgx1gik3ZK0b': 13,
  'https://buy.stripe.com/8x24gs80e0A5dkP1nq3ZK03': 14,
  'https://buy.stripe.com/28EbIU1BQ96Ba8D8PS3ZK02': 15,
  'https://buy.stripe.com/dRmdR2fsG4Ql80v8PS3ZK0h': 16,
  'https://buy.stripe.com/00w5kw94iciN80vaY03ZK0i': 17,
};

async function listAllPaymentLinks() {
  const out = [];
  let startingAfter = null;
  for (let guard = 0; guard < 50; guard++) {
    const qs = new URLSearchParams({ limit: '100' });
    if (startingAfter) qs.set('starting_after', startingAfter);
    const res = await fetch(`https://api.stripe.com/v1/payment_links?${qs}`, {
      headers: { Authorization: `Bearer ${KEY}` },
    });
    if (!res.ok) { console.error('Stripe error', res.status, await res.text()); process.exit(1); }
    const page = await res.json();
    out.push(...page.data);
    if (!page.has_more) break;
    startingAfter = page.data[page.data.length - 1].id;
  }
  return out;
}

function isSold(pl) {
  if (pl.active === false) return true;
  const cs = pl.restrictions && pl.restrictions.completed_sessions;
  return !!(cs && typeof cs.limit === 'number' && cs.count >= cs.limit);
}

const links = await listAllPaymentLinks();
const sold = [];
for (const pl of links) {
  const id = URL_TO_ID[pl.url];
  if (id && isSold(pl)) sold.push(id);
}
sold.sort((a, b) => a - b);

const path = join(dirname(fileURLToPath(import.meta.url)), '..', 'sold.js');
const header = readFileSync(path, 'utf8').split('\n').filter(l => l.startsWith('//')).join('\n');
writeFileSync(path, `${header}\nwindow.SOLD = [${sold.join(', ')}];\n`);
console.log('Sold ids:', sold.join(', ') || '(none)');
