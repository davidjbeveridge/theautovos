import fs from 'node:fs';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:'playwright');
const base=process.env.SITE_PREVIEW_URL||'http://127.0.0.1:8790';
const out='design-artifacts/october-16';fs.mkdirSync(out,{recursive:true});
const manifest=JSON.parse(fs.readFileSync('design-artifacts/demo-manifest.json'));
const browser=await chromium.launch({channel:'chrome',headless:true});const checks=[];
try {
 const context=await browser.newContext({reducedMotion:'reduce'});
 await context.route('**/*',r=>['127.0.0.1',new URL(base).hostname].includes(new URL(r.request().url()).hostname)?r.continue():r.abort());
 const page=await context.newPage();
 for(const route of manifest.pages){
  await page.goto(base+route.path);
  const bad=await page.locator('a[href]').evaluateAll(as=>as.filter(a=>/^https?:/.test(a.href)&&new URL(a.href).origin!==location.origin&&!['theautovos.com','www.theautovos.com','shop.theautovos.com'].includes(new URL(a.href).hostname)).filter(a=>a.target!=='_blank'||!a.relList.contains('noopener')||!a.relList.contains('noreferrer')||a.getAttribute('aria-description')!=='Opens in a new tab').map(a=>a.href));
  assert.deepEqual(bad,[],route.path);
  if(route.path.startsWith('/services/')){
   assert.equal(await page.locator('#customer-reviews').count(),1);
   assert.equal(await page.locator('.site-review-carousel .site-review').count(),5);
   assert.equal(await page.locator('#customer-reviews + .av-invitation').count(),1);
   const review=await page.locator('#customer-reviews').boundingBox();const cta=await page.locator('.av-invitation').last().boundingBox();assert.ok(review.y<cta.y);
  }
  checks.push({route:route.path,externalLinks:'passed',serviceReviews:route.path.startsWith('/services/')?'passed':null});
 }
 for(const width of [390,768,1440]){
  await page.setViewportSize({width,height:1000});await page.goto(base+'/work/');
  const order=await page.locator('main>section,main>header').evaluateAll(es=>es.map(e=>e.querySelector('.site-story-grid')?'videos':e.querySelector('.av-work-grid')?'galleries':e.classList.contains('site-split-header')?'header':'other'));
  assert.deepEqual(order.slice(0,2),['header','videos']);assert.ok(order.indexOf('galleries')>order.indexOf('videos'));
  assert.equal(await page.locator('.site-story-preview__action').count(),3);
  assert.equal(await page.locator('.site-story-preview__action').first().innerText(),'Open installation guide\n→');
  assert.equal(await page.locator('.site-story-preview__action').last().innerText(),'View project video\n→');
  const image=page.locator('.site-story-preview').first();await image.locator('img').evaluate(e=>e.decode());
  assert.ok((await image.boundingBox()).width>300);
  await page.locator('.site-story-grid').screenshot({path:`${out}/work-guides-${width}.png`});
  await image.focus();await page.keyboard.press('Enter');await page.waitForURL('**/resources/porsche-targa-rear-window-tint-installation/');assert.equal(await page.locator('iframe[src*="youtube-nocookie.com/embed/"]').count(),1);
  await page.goto(base+'/services/paint-protection-film/porsche/');
  const cards=page.locator('.site-review-carousel .site-review');
  for(const expanded of [false,true]){
   if(expanded)await page.locator('.site-review-text summary').first().click();
   const heights=await cards.evaluateAll(es=>es.map(e=>e.getBoundingClientRect().height));assert.ok(Math.max(...heights)-Math.min(...heights)<1);
  }
  await page.locator('.site-review-text summary').first().click();
  const scroller=page.locator('.site-review-carousel');await scroller.evaluate(e=>e.scrollTo({left:e.scrollWidth,behavior:'instant'}));await page.waitForFunction(()=>document.querySelector('[data-review-next]').disabled);
  const photo=cards.last().locator('[data-lightbox]').first();await photo.click();assert.equal(await page.locator('#photo-viewer').evaluate(e=>e.open),true);await page.keyboard.press('Escape');assert.equal(await photo.evaluate(e=>e===document.activeElement),true);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  checks.push({width,workOrder:'passed',guideNavigation:'passed',serviceReviewHeightAndViewer:'passed'});
 }
 await page.setViewportSize({width:1440,height:1000});
 const selection=async(selector,dark)=>{
  const el=page.locator(selector).first();const style=await el.evaluate(e=>({bg:getComputedStyle(e,'::selection').backgroundColor,fg:getComputedStyle(e,'::selection').color}));
  assert.equal(style.bg,dark?'rgb(255, 255, 255)':'rgb(18, 18, 18)',selector);assert.equal(style.fg,dark?'rgb(18, 18, 18)':'rgb(255, 255, 255)',selector);
 };
 await page.goto(base+'/work/');await selection('.site-split-header h1',true);await page.locator('.site-split-header h1').dblclick();assert.ok(await page.evaluate(()=>getSelection().toString().length>0));await page.locator('.site-split-header').screenshot({path:out+'/dark-selection.png'});
 await selection('.site-story-preview__action',true);await selection('.av-footer p',true);await selection('.av-invitation h2',true);await selection('.av-invitation .av-button--inverse span',false);
 await page.goto(base+'/contact/');await selection('h1',false);assert.match(await page.locator('main').innerText(),/By appointment only/);assert.match(await page.locator('.av-footer').innerText(),/By appointment only/);
 await page.goto(base+'/about/');const original=page.url();const popupWait=context.waitForEvent('page');await page.locator('a[href*="instagram.com"]').first().click();const popup=await popupWait;assert.equal(page.url(),original);await popup.close();
 checks.push({selection:'light and dark including native selection passed',externalPopup:'passed',appointment:'passed'});
 for(const route of ['/design-system/','/templates/work.html']){
  await page.goto('http://127.0.0.1:8787'+route);
  assert.equal(await page.locator('.site-story-preview__action').count(),3);
  const bad=await page.locator('a[href^="http"]').evaluateAll(as=>as.filter(a=>!['theautovos.com','www.theautovos.com','shop.theautovos.com'].includes(new URL(a.href).hostname)).filter(a=>a.target!=='_blank'||!a.relList.contains('noopener')).map(a=>a.href));assert.deepEqual(bad,[]);
  if(route.includes('templates'))await page.screenshot({path:out+'/work-template.png',fullPage:true});
  checks.push({route,templateParity:'passed'});
 }
 fs.writeFileSync(out+'/execution-proof.json',JSON.stringify({browser:'Google Chrome',checks},null,2));console.log(`${checks.length} October 16 Chrome checks passed.`);
}finally{await browser.close();}
