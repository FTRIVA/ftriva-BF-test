import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const pages = [
  'index.html', 'programmes.html', 'memberships.html', 'how-it-works.html',
  'sponsorships.html', 'founding10.html', 'start-assessment.html',
  'assessment.html', 'payment-callback.html', 'privacy.html'
];
const expectedPrices = {
  START: { display: 'R199', amount: 19900 },
  PROGRESS: { display: 'R399', amount: 39900 },
  PERFORMANCE: { display: 'R299', amount: 29900 },
  DIGITAL: { display: 'R49', amount: 4900 },
  ESSENTIAL: { display: 'R249 / month', amount: 24900 },
  PLUS: { display: 'R399 / month', amount: 39900 },
  ELITE: { display: 'R599 / month', amount: 59900 }
};

const app = read('public/app.js');
const worker = read('src/index.js');
const programmes = read('public/programmes.html');
const memberships = read('public/memberships.html');
const css = read('public/styles.css');
const wrangler = read('wrangler.jsonc');
const publicFiles = pages.map(page => read('public/' + page)).join('\n') + app;

for (const [id, info] of Object.entries(expectedPrices)) {
  assert.ok(app.includes(id + ':{name:\'' + id + '\',price:\'' + info.display + '\''), 'Browser price mismatch for ' + id);
  const backend = new RegExp(id + ':\\s*\\{[^}]*amount:\\s*' + info.amount + '\\b');
  assert.match(worker, backend, 'Worker amount mismatch for ' + id);
}
for (const amount of ['R199', 'R399', 'R299', 'R49']) {
  assert.ok(programmes.includes('<strong>' + amount + '</strong>'), 'Programme price missing: ' + amount);
}
for (const amount of ['R249', 'R399', 'R599']) {
  assert.ok(memberships.includes(amount), 'Membership price missing: ' + amount);
}

assert.ok(wrangler.includes('"PAYSTACK_PLAN_ESSENTIAL": "PLN_xn18tbtoq11ftll"'), 'ESSENTIAL plan code mismatch');
assert.ok(wrangler.includes('"PAYSTACK_PLAN_PLUS": "PLN_xqfeamf436nwscj"'), 'PLUS plan code mismatch');
assert.ok(wrangler.includes('"PAYSTACK_PLAN_ELITE": "PLN_4qgvwhs6xus1wnb"'), 'ELITE plan code mismatch');
assert.ok(wrangler.includes('"ENVIRONMENT": "test"'), 'This repository must remain test-only');

for (const page of pages) {
  const file = 'public/' + page;
  assert.ok(fs.existsSync(path.join(root, file)), 'Missing page: ' + file);
  const html = read(file);
  assert.ok(html.includes('<title>') && html.includes('</title>'), 'Missing title: ' + page);
  assert.ok(html.includes('name="viewport"'), 'Missing mobile viewport: ' + page);
  assert.ok(html.includes('href="styles.css"'), 'Missing stylesheet: ' + page);
  assert.ok(html.includes('src="app.js"'), 'Missing browser script: ' + page);

  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const raw = match[1];
    if (/^(https?:|mailto:|tel:|data:|#|javascript:)/i.test(raw) || raw === '/' || raw.startsWith('/my-account')) continue;
    const target = raw.split(/[?#]/, 1)[0];
    if (!target) continue;
    const resolved = path.resolve(path.dirname(path.join(root, file)), target);
    assert.ok(resolved.startsWith(path.join(root, 'public')), 'Unsafe local asset path in ' + page + ': ' + raw);
    assert.ok(fs.existsSync(resolved), 'Broken local link/asset in ' + page + ': ' + raw);
  }
}

for (const [token, hex] of Object.entries({
  navy: '#101d2b', sage: '#a8b8a0', ivory: '#f5f1e8', bronze: '#b08d57'
})) {
  assert.ok(css.toLowerCase().includes(hex), 'Brand palette missing ' + token + ' ' + hex);
}

for (const route of [
  '"/api/payment/initialize"', '"/api/payment/verify"', '"/api/paystack/webhook"',
  '"/api/founding10/claim"', '"/api/assessment/submit"'
]) assert.ok(worker.includes(route), 'Missing Worker API route: ' + route);
assert.ok(app.includes('ftriva_founding10_claim'), 'Founding 10 claim handoff missing');
assert.ok(app.includes('ftriva_verified_reference'), 'Payment verification handoff missing');
assert.ok(!/(?:sk_(?:live|test)_|sb_secret_)/i.test(publicFiles), 'Server-side secret appears in public website assets');

console.log('FTRIVA website checks passed: ' + pages.length + ' pages, 7 package prices, 3 membership plan codes, local links/assets, mobile metadata, brand palette and required API routes.');
