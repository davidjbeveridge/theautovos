import assert from 'node:assert/strict';
import fs from 'node:fs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE);
const browser=await chromium.launch({channel:'chrome',headless:true});const results=[];
try{for(const width of [390,768,1440]){
 const page=await browser.newPage({viewport:{width,height:1000},reducedMotion:'reduce'});
 await page.goto('http://127.0.0.1:8790/');
 const carousel=page.locator('.site-review-carousel');await carousel.scrollIntoViewIfNeeded();
 const visible=await carousel.evaluate(el=>{const r=el.getBoundingClientRect();return [...el.querySelectorAll('.site-review')].filter(c=>{const b=c.getBoundingClientRect();return b.left>=r.left-1&&b.right<=r.right+1}).length});assert.equal(visible,width>1000?3:width>640?2:1);
 await page.locator('[data-review-next]').click();await page.waitForTimeout(250);assert(await carousel.evaluate(e=>e.scrollLeft)>0);
 await carousel.focus();await page.keyboard.press('ArrowRight');
 assert.equal(await page.locator('a[href^="https://www.xpel.com"]').evaluateAll(as=>as.every(a=>a.target==='_blank'&&a.rel.includes('noopener'))),true);
 if(width<1000)await page.locator('.av-mobile-menu summary').scrollIntoViewIfNeeded();
 if(width===768){await page.locator('.av-mobile-menu summary').hover();assert(await page.locator('.av-mobile-menu').evaluate(e=>e.open));await page.keyboard.press('Escape');assert(!(await page.locator('.av-mobile-menu').evaluate(e=>e.open)));}
 await page.goto('http://127.0.0.1:8790/resources/porsche-997-front-fender-ppf-installation/');
 assert.equal(await page.locator('.site-targa-steps>li').count(),7);assert.equal(await page.locator('iframe[src*="DFrqoozu5S0"]').count(),1);assert.equal(await page.locator('video.site-step-clip').count(),7);
 for(const img of await page.locator('.site-targa-steps img').all()){await img.scrollIntoViewIfNeeded();await img.evaluate(e=>e.decode());assert(await img.getAttribute('srcset'));}
 const v=page.locator('video.site-step-clip').first();await v.scrollIntoViewIfNeeded();await v.evaluate(e=>e.play());await page.waitForTimeout(400);assert(await v.evaluate(e=>e.currentTime)>0);await v.evaluate(e=>e.pause());
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await page.locator('.site-targa-steps a[data-lightbox]').first().click();assert(await page.locator('#photo-viewer').evaluate(e=>e.open));await page.keyboard.press('Escape');assert(!(await page.locator('#photo-viewer').evaluate(e=>e.open)));
 if(width===768){await page.locator('.site-split-header').screenshot({path:'design-artifacts/site/fender-guide-header.png'});}
 await page.goto('http://127.0.0.1:8790/gallery/windshield-protection-film/');for(const img of await page.locator('.site-gallery img').all()){await img.scrollIntoViewIfNeeded();await img.evaluate(e=>e.decode());}assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 results.push({width,visibleReviewCards:visible,steps:7,clips:7,playback:true,lightbox:true});await page.close();
}
fs.writeFileSync('design-artifacts/site/october-content-proof.json',JSON.stringify({passed:true,results},null,2));console.log(results);
}finally{await browser.close();}
