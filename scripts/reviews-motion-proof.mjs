import fs from 'node:fs';import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');const browser=await chromium.launch({channel:'chrome',headless:true});const checks=[];const base=process.env.PROOF_ORIGIN||'http://127.0.0.1:8790';
try{
 const page=await browser.newPage();
 for(const width of [390,768,1440]){
  await page.setViewportSize({width,height:900});await page.goto(base+'/');
  const reviews=page.locator('#customer-reviews');await reviews.scrollIntoViewIfNeeded();
  assert.equal(await reviews.locator('.site-review').count(),5);assert.equal(await reviews.locator('.site-review-photos img').count(),16);
  assert.equal(await reviews.evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(18, 18, 18)');
  for(const image of await reviews.locator('img').all()){await image.scrollIntoViewIfNeeded();await image.evaluate(i=>i.decode());assert.ok(await image.evaluate(i=>i.naturalWidth>0&&!!i.srcset));}
  const detail=reviews.locator('details').first();await detail.locator('summary').focus();await page.keyboard.press('Enter');assert.ok(await detail.evaluate(e=>e.open));assert.ok((await detail.locator('blockquote').textContent()).length>250);
  const photo=reviews.locator('[data-lightbox]').first();await photo.focus();await page.keyboard.press('Enter');assert.ok(await page.locator('#photo-viewer').evaluate(e=>e.open));await page.keyboard.press('Escape');assert.ok(await photo.evaluate(e=>e===document.activeElement));
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  await reviews.locator('.site-review').first().screenshot({path:`design-artifacts/site/review-card-${width}.png`});
  assert.ok(await reviews.locator('.av-motion-enter').count());
  await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await reviews.locator('.site-review').first().evaluate(e=>getComputedStyle(e).animationName),'none');assert.equal(await photo.locator('img').evaluate(e=>getComputedStyle(e).transitionDuration),'0s');await page.emulateMedia({reducedMotion:'no-preference'});
  checks.push({width,reviews:5,photos:16,fullText:true,lightboxKeyboard:true,reducedMotion:true,noOverflow:true});
 }
 await page.goto(base+'/gallery/');const galleryLink=page.locator('.av-work-item a').first();await galleryLink.click();const galleryImage=page.locator('.site-gallery img').first();await galleryImage.scrollIntoViewIfNeeded();assert.ok(await galleryImage.evaluate(i=>i.complete&&i.naturalWidth>0));await galleryImage.hover();await page.waitForTimeout(500);assert.notEqual(await galleryImage.evaluate(i=>getComputedStyle(i).transform),'none');checks.push({galleryHover:true});
 const nojs=await browser.newPage({javaScriptEnabled:false});await nojs.goto(base+'/');assert.equal(await nojs.locator('.site-review-photos img').count(),16);await nojs.locator('.site-review details summary').first().click();assert.ok(await nojs.locator('.site-review details').first().evaluate(e=>e.open));checks.push({noJavaScript:true});
 // The source/catalog server is separate from the generated service site.
 await page.goto('http://127.0.0.1:8787/design-system/');await page.locator('#selected-reviews').scrollIntoViewIfNeeded();assert.equal(await page.locator('#selected-reviews .site-review').count(),1);const catPhoto=page.locator('#selected-reviews [data-lightbox]').first();await catPhoto.focus();await page.keyboard.press('Enter');assert.ok(await page.locator('.av-media-viewer').evaluate(e=>e.open));await page.keyboard.press('Escape');assert.ok(await catPhoto.evaluate(e=>e===document.activeElement));checks.push({catalogSharedReviewMotionLightbox:true});
 fs.writeFileSync('design-artifacts/site/reviews-motion-proof.json',JSON.stringify({origin:base,checks},null,2));console.log(`${checks.length} review/motion checks passed`);
}finally{await browser.close()}
