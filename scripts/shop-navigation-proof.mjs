import fs from 'node:fs';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const {chromium} = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const live = process.argv.includes('--live');
const bases = live ? ['https://theautovos.com', 'https://7c4e9a.demos.beveridge.io'] : [process.env.SITE_PREVIEW_URL || 'http://127.0.0.1:8793'];
const shop = 'https://shop.theautovos.com/';
const out = 'design-artifacts/shop-navigation-2026-10-22';
fs.mkdirSync(out, {recursive:true});
const checks = [];
const browser = await chromium.launch({channel:'chrome', headless:true});
try {
  for (const base of bases) for (const width of [390, 1440]) {
    const context = await browser.newContext({viewport:{width, height:900}, isMobile:width < 900, hasTouch:width < 900, reducedMotion:'reduce'});
    if (!live) await context.route('**/*', route => {
      const url = new URL(route.request().url());
      if (url.origin === base) return route.continue();
      if (url.href === shop) return route.fulfill({contentType:'text/html', body:`<!doctype html><title>Shop fixture</title><h1>Auto Vos shop fixture</h1><a href="${base}/">Back to Auto Vos</a>`});
      return route.abort();
    });
    const page = await context.newPage();
    await page.goto(base + '/', {waitUntil:'domcontentloaded'});
    if (width < 900) await page.locator('.av-mobile-menu summary').click();
    const link = page.locator(width < 900 ? '.av-mobile-menu a' : '.av-nav a').filter({hasText:/^Shop$/});
    assert.equal(await link.getAttribute('href'), shop);
    assert.equal(await link.getAttribute('target'), null);
    await link.focus();
    await Promise.all([page.waitForURL(shop, {waitUntil:'domcontentloaded'}), page.keyboard.press('Enter')]);
    assert.equal(context.pages().length, 1, 'Shop uses existing tab');
    assert.equal(page.url(), shop, 'Shop root stays on shop without recovery query');
    await page.screenshot({path:`${out}/${live ? new URL(base).hostname : 'local'}-shop-${width}.png`});
    let back = page.getByRole('link', {name:'Back to Auto Vos', exact:true});
    if (live && !await back.first().isVisible()) {
      await page.locator('.header-burger-btn').click();
    }
    back = page.getByRole('link', {name:'Back to Auto Vos', exact:true}).filter({visible:true}).first();
    const destination = live ? 'https://theautovos.com/' : base + '/';
    await Promise.all([page.waitForURL(destination, {waitUntil:'domcontentloaded'}), back.click()]);
    assert.equal(context.pages().length, 1, 'Store backlink stays in existing tab');
    assert.equal(page.url(), destination);
    await page.goto(base + '/contact/', {waitUntil:'domcontentloaded'});
    const footer = page.locator('.av-footer a[data-shop]');
    assert.equal(await footer.getAttribute('href'), shop);
    assert.equal(await footer.getAttribute('target'), null);
    await Promise.all([page.waitForURL(shop, {waitUntil:'domcontentloaded'}), footer.click()]);
    assert.equal(context.pages().length, 1, 'Footer also uses existing tab');
    await page.goto(base + '/', {waitUntil:'domcontentloaded'});
    const xpel = page.locator('a[href*="xpel.com"]').first();
    assert.equal(await xpel.getAttribute('target'), '_blank');
    assert.match(await xpel.getAttribute('rel'), /noopener noreferrer/);
    checks.push({base, width, keyboardShop:'passed', shopRoot:'passed', backToMain:'passed', footer:'passed', xpelNewTab:'passed'});
    await context.close();
  }
  fs.writeFileSync(`${out}/${live ? 'live' : 'local'}-browser-proof.json`, JSON.stringify({browser:'Google Chrome', checks, limits:live ? 'Anonymous existing-tab navigation only; no order or inquiry submitted.' : 'Local UI uses an explicit shop fixture; live store is verified separately.'}, null, 2));
  console.log(`${checks.length} ${live ? 'live' : 'local'} desktop/mobile shop journeys passed.`);
} finally {
  await browser.close();
}
