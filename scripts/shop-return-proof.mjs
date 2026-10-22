import http from 'node:http';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const {chromium} = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const source = fs.readFileSync('src/site/shop-return.js', 'utf8');
const checks = [];
const browser = await chromium.launch({channel:'chrome', headless:true});
try {
 for (const width of [390, 1440]) {
  let old = true, rootRequests = 0, oldScripts = 0, newScripts = 0;
  const server = http.createServer((req, res) => {
   const url = new URL(req.url, 'http://localhost');
   if (url.pathname === '/client.js') {
    const current = url.searchParams.has('v');
    if (current) newScripts++; else oldScripts++;
    res.writeHead(200, {'content-type':'text/javascript', 'cache-control':'public, max-age=3600'});
    res.end(current ? source : '// Previous site script without cache repair');
   } else if (url.pathname === '/previous-visit') {
    res.writeHead(200, {'content-type':'text/html', 'cache-control':'no-store'});
    res.end('<script src="/client.js"></script>');
   } else if (url.pathname === '/shop') {
    res.writeHead(200, {'content-type':'text/html', 'cache-control':'no-store'});
    res.end(`<a href="${url.search ? '/?from=shop&utm_source=merch#details' : '/'}">Back to Auto Vos</a>`);
   } else if (url.pathname === '/') {
    if (!url.search) rootRequests++;
    if (!url.search && old) {
     res.writeHead(301, {location:'/shop', 'cache-control':'public, max-age=3600'});
     res.end();
    } else {
     res.writeHead(200, {'content-type':'text/html', 'cache-control':'public, max-age=0, must-revalidate'});
     res.end('<title>Main site</title><h1>Main site</h1><a href="/shop?updated=1">Shop</a><script src="/client.js?v=current"></script>');
    }
   } else {res.writeHead(404); res.end();}
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const context = await browser.newContext({viewport:{width, height:900}, isMobile:width < 900, hasTouch:width < 900});
  try {
   const page = await context.newPage();
   // No request routing: it disables the browser's native HTTP cache.
   await page.goto(base + '/previous-visit');
   assert.equal(oldScripts, 1);
   await page.goto(base + '/');
   assert.equal(page.url(), base + '/shop');
   assert.equal(rootRequests, 1);
   old = false;
   await page.getByRole('link', {name:'Back to Auto Vos'}).click();
   assert.equal(page.url(), base + '/shop', 'Old permanent redirect still affects the return link');
   assert.equal(rootRequests, 1, 'Confirmed Chrome reused the cached 301 without contacting the fixed server');
   await page.goto(base + '/shop?updated=1');
   await page.getByRole('link', {name:'Back to Auto Vos'}).click();
   await page.waitForURL(base + '/?utm_source=merch#details');
   assert.equal(await page.title(), 'Main site');
   assert.equal(rootRequests, 2, 'Cache reload fetched the current root');
   assert.equal(newScripts, 1, 'New script URL bypassed the previous one-hour script cache');
   await page.getByRole('link', {name:'Shop', exact:true}).click();
   await page.goto(base + '/');
   assert.equal(page.url(), base + '/');
   assert.equal(await page.title(), 'Main site', 'Bare root works after repairing the cached redirect');
   checks.push({width, warmed301:'reproduced', staleScript:'bypassed', freshReturn:'passed', campaignAndHash:'preserved', rootCacheRepair:'passed'});
  } finally {
   await context.close();
   await new Promise(resolve => server.close(resolve));
  }
 }
 fs.mkdirSync('design-artifacts/shop-navigation-2026-10-22', {recursive:true});
 fs.writeFileSync('design-artifacts/shop-navigation-2026-10-22/cached-redirect-proof.json', JSON.stringify({browser:'Google Chrome', checks, limits:'Controlled HTTP server reproduces a real browser-cached permanent redirect; live links are checked separately.'}, null, 2));
 console.log(`${checks.length} real warmed-301 cache recovery journeys passed.`);
} finally {await browser.close();}
