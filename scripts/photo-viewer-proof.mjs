import assert from 'node:assert/strict';
import fs from 'node:fs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({channel:'chrome',headless:true});
const base=process.env.PROOF_ORIGIN||'http://127.0.0.1:8790';
const checks=[];
try{
 const page=await browser.newPage();
 for(const width of [390,768,1440]){
  await page.setViewportSize({width,height:900});await page.goto(base);
  const reviews=page.locator('.site-review');
  for(let r=0;r<await reviews.count();r++){
   const review=reviews.nth(r),links=review.locator('[data-lightbox]'),n=await links.count();
   const summary=review.locator('summary');if(await summary.count()){await summary.hover();
   assert.equal(await summary.evaluate(e=>getComputedStyle(e).textDecorationLine),'none');}
   await links.first().click();const dialog=page.locator('#photo-viewer');
   assert.equal(await dialog.locator('.av-viewer-thumbs button').count(),n);
   assert.equal(await dialog.evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(18, 18, 18)');
   await page.keyboard.press('ArrowLeft');
   assert.equal(await dialog.locator('[data-photo-image]').getAttribute('src'),await links.last().evaluate(e=>e.href));
   await page.keyboard.press('ArrowRight');
   assert.equal(await dialog.locator('[data-photo-count]').textContent(),`1 / ${n}`);
   await dialog.locator('[data-photo-next]').click();
   assert.equal(await dialog.locator('[data-photo-count]').textContent(),`2 / ${n}`);
   await dialog.locator('.av-viewer-thumbs button').last().click();
   assert.equal(await dialog.locator('[data-photo-count]').textContent(),`${n} / ${n}`);
   await page.keyboard.press('Tab');assert.ok(await dialog.locator('[data-close-photo]').evaluate(e=>e===document.activeElement));
   await dialog.locator('[data-photo-image]').evaluate(e=>e.decode());
   if(r===4)await dialog.screenshot({path:`design-artifacts/site/scoped-viewer-${width}.png`});
   await page.keyboard.press('Escape');assert.ok(await links.first().evaluate(e=>e===document.activeElement));
  }
  checks.push({width,reviewScopes:5,keyboard:true,thumbnails:true,dark:true,noReviewUnderline:true});
 }
 await page.goto(base+'/resources/porsche-targa-rear-window-tint-installation/');
 const steps=page.locator('.site-targa-steps [data-lightbox]');await steps.first().click();
 assert.equal(await page.locator('.av-viewer-thumbs button').count(),await steps.count());
 await page.keyboard.press('Escape');checks.push({guideScope:true});
 await page.goto('http://127.0.0.1:8787/design-system/');await page.locator('#selected-reviews [data-lightbox]').first().click();
 assert.equal(await page.locator('.av-viewer-thumbs button').count(),6);
 assert.equal(await page.locator('.av-media-viewer').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(18, 18, 18)');checks.push({catalog:true});
 fs.writeFileSync('design-artifacts/site/photo-viewer-proof.json',JSON.stringify({base,checks},null,2));console.log('Scoped photo viewer checks passed');
}finally{await browser.close()}
