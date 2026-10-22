import fs from 'node:fs';
import assert from 'node:assert/strict';

const shop = 'https://shop.theautovos.com/';
const main = 'https://theautovos.com';
const preview = 'https://7c4e9a.demos.beveridge.io';
const checks = [];
const anchors = html => [...html.matchAll(/<a\b[^>]*>/gi)].map(m => m[0]);
const attr = (tag, name) => tag.match(new RegExp(`\\s${name}\\s*=\\s*(["'])(.*?)\\1`, 'i'))?.[2];
function checkLinks(html, label) {
  const links = anchors(html).filter(a => attr(a, 'href') === shop);
  assert.equal(links.length, 3, `${label}: desktop, mobile and footer Shop links`);
  for (const a of links) {
    assert.equal(attr(a, 'target'), undefined, `${label}: native same-tab Shop link`);
    assert.doesNotMatch(attr(a, 'rel') || '', /noreferrer/i, label);
    assert.notEqual(attr(a, 'aria-description'), 'Opens in a new tab', label);
  }
  assert(!html.includes('https://www.theautovos.com/shop'), `${label}: no legacy Shop alias`);
  checks.push(label);
}
for (const mode of ['demo', 'production', 'hosted-demo']) {
  const manifest = JSON.parse(fs.readFileSync(`design-artifacts/${mode}-manifest.json`));
  assert.equal(manifest.config.shop, shop, `${mode}: canonical store URL`);
  for (const page of [...manifest.pages, {path:'/404.html'}]) {
    const file = page.path === '/' ? 'index.html' : page.path === '/404.html' ? '404.html' : page.path.slice(1) + 'index.html';
    checkLinks(fs.readFileSync(`dist-${mode}/${file}`, 'utf8'), `${mode} ${page.path}`);
  }
}
async function request(url, headers = {}) {
  const response = await fetch(url, {redirect:'manual', headers, signal:AbortSignal.timeout(30000)});
  const html = await response.text();
  assert.equal(response.status, 200, `${url}: ${response.status} ${response.headers.get('location') || ''}`);
  return html;
}
if (!process.argv.includes('--local-only')) {
  for (const origin of [main, preview]) {
    for (const path of ['/', '/contact/', '/work/']) checkLinks(await request(origin + path), origin + path);
  }
  let store;
  for (const referer of [null, main + '/', preview + '/']) {
    store = await request(shop, referer ? {referer} : {});
    assert.match(store, /rel="canonical" href="https:\/\/shop\.theautovos\.com\/?"/);
    assert.match(store, /Back to Auto Vos/);
    const back = anchors(store).filter(a => attr(a, 'href') === main + '/');
    assert(back.length > 0, 'Store backlink to canonical main site');
    assert(back.every(a => !attr(a, 'target') || attr(a, 'target') === '_self'), 'Store backlink stays in tab');
    checks.push(`Direct shop root with ${referer || 'no referrer'}`);
  }
  const catalog = await request(shop + 'shop');
  const product = anchors(catalog).map(a => attr(a, 'href')).find(h => h?.startsWith('/shop/'));
  assert(product, 'Real merchandise product is linked from catalog');
  await request(new URL(product, shop));
  await request(shop + 'cart');
  checks.push('Store catalog, product and empty cart are reachable');
  const www = await fetch('https://www.theautovos.com/', {redirect:'manual', signal:AbortSignal.timeout(30000)});
  assert.equal(www.status, 308);
  assert.equal(www.headers.get('location'), main + '/');
  checks.push('www redirects to canonical main site');
}
fs.mkdirSync('design-artifacts/shop-navigation-2026-10-22', {recursive:true});
fs.writeFileSync('design-artifacts/shop-navigation-2026-10-22/navigation-proof.json', JSON.stringify({checks, live:!process.argv.includes('--local-only'), limits:'Read-only GETs; no orders or inquiries submitted.'}, null, 2));
console.log(`${checks.length} shop navigation checks passed.`);
