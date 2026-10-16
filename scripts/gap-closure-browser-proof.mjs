import fs from 'node:fs';
import assert from 'node:assert/strict';
import {guideMedia} from '../src/site/guide-media.mjs';
const {chromium} = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({channel: 'chrome', headless: true});
const results = [];
try {
  const page = await browser.newPage({reducedMotion: 'reduce'});
  await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
  for (const width of [390,768,1440]) {
    await page.setViewportSize({width, height: 900});
    for (const [slug, mapping] of Object.entries(guideMedia)) {
      await page.goto('http://127.0.0.1:8790/resources/' + slug + '/');
      const media = page.locator('[data-guide-section].site-media-explanation');
      assert.equal(await media.count(), mapping.filter(m => m.image || m.diagram).length);
      const hero = await page.locator('.site-split-header img').getAttribute('src');
      for (const row of await media.all()) {
        assert.equal(await row.locator('h2').count(), 1);
        const img = row.locator('img'); await img.scrollIntoViewIfNeeded(); await img.evaluate(el => el.decode());
        assert.notEqual(await img.getAttribute('src'), hero);
        for (const attr of ['alt','title','srcset','width','height']) assert(await img.getAttribute(attr), attr);
        const copy = await row.locator('.site-media-explanation__copy').boundingBox();
        const picture = await img.boundingBox();
        if (width > 760) {assert(copy.x < picture.x); assert(picture.height <= 401);}
        else assert(copy.y < picture.y);
        const trigger = row.locator('[data-lightbox]'); await trigger.click();
        assert.equal(await page.locator('dialog[open]').count(), 1);
        assert.equal(await page.locator('[data-photo-count]').textContent(), '1 / 1');
        await page.keyboard.press('Escape'); assert(await trigger.evaluate(el => el === document.activeElement));
      }
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      await media.first().screenshot({path: `design-artifacts/october-15/${slug}-closure-${width}.png`});
      results.push({slug,width,pairedSections:await media.count(),scopedViewer:true});
    }
  }
  fs.writeFileSync('design-artifacts/october-15/gap-closure-browser-proof.json', JSON.stringify({passed:true,results},null,2));
  console.log('18 guide layout scenarios passed; all media loaded, bounded and independently enlargeable.');
} finally {await browser.close();}
