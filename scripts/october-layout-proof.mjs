import fs from 'node:fs';
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({channel:'chrome',headless:true});
const base=process.env.SITE_PREVIEW_URL||'http://127.0.0.1:8790';
const out='design-artifacts/october-15';
const results=[];
const galleries=JSON.parse(fs.readFileSync('src/site/galleries.json')).map(g=>({...g,path:'/gallery/'+g.path.replaceAll('/','')+'/'}));
const approved=JSON.parse(fs.readFileSync('src/site/approved-media.json'));
try {
 const context=await browser.newContext({reducedMotion:'reduce'});
 await context.route('**/*',r=>['127.0.0.1'].includes(new URL(r.request().url()).hostname)?r.continue():r.abort());
 const page=await context.newPage();
 for(const width of [390,768,1440]){
  await page.setViewportSize({width,height:900});
  await page.goto(base+'/resources/');
  const rows=page.locator('.site-guide-index .site-editorial-row');assert.equal(await rows.count(),8);
  for(let i=0;i<8;i++){
   const row=rows.nth(i);const copy=await row.locator('.site-editorial-row__copy').boundingBox(),media=await row.locator('figure').boundingBox();
   if(width>760)assert(i%2?media.x<copy.x:copy.x<media.x);else assert(copy.y<media.y);
   assert.equal(await row.evaluate(e=>getComputedStyle(e).borderBottomWidth),'0px');
   const img=row.locator('img');await img.scrollIntoViewIfNeeded();await img.evaluate(e=>e.decode());assert(await img.getAttribute('srcset'));
  }
  await page.locator('.site-guide-index').screenshot({path:`${out}/guides-rows-${width}.png`});
  await page.locator('.site-split-header').screenshot({path:`${out}/guides-header-${width}.png`});
  for(const path of ['/work/','/contact/','/services/window-tint/','/services/paint-protection-film/','/services/ceramic-coating/','/services/windshield-protection-film/','/resources/ppf-vs-ceramic-coating/','/resources/porsche-targa-rear-window-tint-installation/','/resources/porsche-997-front-fender-ppf-installation/']){
   await page.goto(base+path);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,path);
   for(const image of await page.locator('main img').all()){
    await image.scrollIntoViewIfNeeded();await image.evaluate(e=>e.decode());
    if(await image.evaluate(e=>e.naturalWidth>=480)&&!((await image.getAttribute('src'))||'').endsWith('.svg'))assert(await image.getAttribute('srcset'),path+' responsive '+await image.getAttribute('src'));
   }
   const pair=page.locator('.site-media-explanation').first();
   if(await pair.count()){
    const img=pair.locator('img');const box=await img.boundingBox();if(width>760){assert(box.width<width*.6);assert(box.height<=401);}
    await pair.screenshot({path:`${out}/${path.split('/').filter(Boolean).at(-1)}-pair-${width}.png`});
    const trigger=pair.locator('[data-lightbox]');await trigger.click();assert.equal(await page.locator('dialog[open]').count(),1);await page.keyboard.press('Escape');assert(await trigger.evaluate(e=>e===document.activeElement));
   }
   const steps=page.locator('.site-targa-steps>li');
   if(await steps.count()){
    assert(await page.locator('iframe[src*="youtube-nocookie"]').count());
    for(const step of await steps.all()){assert.equal(await step.locator('.site-step-copy').count(),1);assert.equal(await step.locator('.site-step-media').count(),1);}
    await steps.first().screenshot({path:`${out}/${path.includes('997')?'997':'targa'}-step-${width}.png`});
   }
   if(path.includes('windshield-protection'))assert(await page.locator(`img[src="${approved.windshieldExplanation.src}"]`).count());
   if(path==='/contact/')assert(await page.locator(`img[src="${approved.waiting.src}"]`).count());
   results.push({path,width,imagesLoaded:true,pairAndFlow:true});
  }
  await page.goto(base);
  assert.equal(await page.locator('.site-review').count(),5);
  for(const gallery of galleries){const a=page.locator(`main a[href="${gallery.path}"]`).filter({has:page.locator('img')});assert.equal(await a.count(),1);}
  assert((await page.content()).includes('shop-film-v6.mp4'));assert((await page.content()).includes('shop-film-mobile-v6.mp4'));
  await page.locator('.site-review-carousel').screenshot({path:`${out}/reviews-${width}.png`});
  results.push({path:'/',width,fourCategories:true,fiveReviews:true,heroV6:true});
 }
 await page.goto(base+'/gallery/stealth-matte-ppf/');const pics=page.locator('.site-gallery figure>a');await pics.first().click();assert.equal(await page.locator('.av-viewer-thumbs button').count(),14);await page.keyboard.press('ArrowRight');assert.equal(await page.locator('[data-photo-count]').textContent(),'2 / 14');await page.keyboard.press('Escape');assert(await pics.first().evaluate(e=>e===document.activeElement));
 for(const width of [390,1440]){
  await page.setViewportSize({width,height:900});await page.goto('http://127.0.0.1:8787/design-system/');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  const sample=page.locator('.ds-editorial-patterns .site-media-explanation');await sample.scrollIntoViewIfNeeded();await sample.locator('img').evaluate(e=>e.decode());await sample.screenshot({path:`${out}/catalog-pair-${width}.png`});
  await sample.locator('[data-lightbox]').click();assert.equal(await page.locator('dialog[open]').count(),1);await page.keyboard.press('Escape');
  results.push({catalog:true,width,viewer:true});
 }
 const touch=await browser.newPage({hasTouch:true,isMobile:true,viewport:{width:390,height:844}});await touch.goto(base);await touch.locator('.av-mobile-menu summary').tap();assert.equal(await touch.locator('.av-mobile-menu').getAttribute('open'),'');await touch.locator('.av-mobile-menu summary').tap();assert.equal(await touch.locator('.av-mobile-menu').getAttribute('open'),null);await touch.close();
 const nojs=await browser.newPage({javaScriptEnabled:false,viewport:{width:390,height:844}});await nojs.goto(base+'/resources/');assert.equal(await nojs.locator('.site-editorial-row').count(),8);await nojs.goto(base+'/gallery/stealth-matte-ppf/');assert.equal(await nojs.locator('.site-gallery figure>a').count(),14);await nojs.close();
 fs.writeFileSync(`${out}/layout-proof.json`,JSON.stringify({results,scopedGalleryKeyboard:true,noJsDiscovery:true},null,2));console.log(`${results.length} layout scenarios passed`);
}finally{await browser.close();}
