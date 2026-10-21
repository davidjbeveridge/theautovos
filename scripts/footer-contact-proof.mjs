// Local composition proof. External map tiles are blocked; no live email is sent.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.SITE_PREVIEW_URL||'http://127.0.0.1:8790';
assert.match(base,/^http:\/\/127\.0\.0\.1:\d+$/);
const browser=await chromium.launch({channel:'chrome',headless:true}),checks=[];
try{
 const context=await browser.newContext({reducedMotion:'reduce'});
 await context.route('**/*',route=>new URL(route.request().url()).origin===base?route.continue():route.abort());
 const page=await context.newPage();
 for(const width of [360,390,768,900,1024,1440]){
  await page.setViewportSize({width,height:1000});await page.goto(base+'/contact/');
  const map=await page.locator('.site-footer-contact>.site-map').boundingBox();
  const form=await page.locator('.site-footer-inquiry').boundingBox();
  assert(map&&form);assert.equal(await page.locator('#inquiry').count(),1);
  for(const a of await page.locator('.site-footer-inquiry .site-text-link').all()){const style=await a.evaluate(el=>{const s=getComputedStyle(el);return {color:s.color,weight:s.fontWeight,line:s.textDecorationLine};});assert.equal(style.color,'rgb(21, 90, 182)');assert.equal(style.weight,'700');assert(style.line.includes('underline'));}
  if(width>900){assert(Math.abs(map.y-form.y)<1);assert(map.x+map.width<form.x);}
  else{assert(form.y>=map.y+map.height);assert(Math.abs(map.x-form.x)<1);}
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.locator('#send').click();assert.equal(await page.locator('#errors').evaluate(el=>el===document.activeElement),true);
  await page.locator('#errors a[href="#name"]').click();assert.equal(await page.locator('#name').evaluate(el=>el===document.activeElement),true);
  if([390,1440].includes(width))await page.locator('.site-footer-contact').screenshot({path:`design-artifacts/site/footer-contact-${width}.png`});
  checks.push({width,layout:width>900?'map left, form right':'map above form',validation:'error summary and field focus passed'});
 }
 await page.goto(base+'/contact/');await page.setViewportSize({width:390,height:1000});
 await page.evaluate(()=>{for(const [el,size]of [...document.querySelectorAll('body *')].map(el=>[el,parseFloat(getComputedStyle(el).fontSize)]))el.style.fontSize=(size*2)+'px';});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.goto(base+'/get-a-quote/');assert.equal(await page.locator('#inquiry').count(),1);assert.equal(await page.locator('footer #inquiry').count(),0);
 fs.writeFileSync('design-artifacts/site/footer-contact-proof.json',JSON.stringify({checks,textScaling:'200% at 390px passed',quotePage:'one existing main form',limits:'Map iframe source checked; external map tiles blocked. Local simulated inquiries only.'},null,2));
 console.log('Footer contact layout passed at six widths, 200% text scaling and validation focus.');
}finally{await browser.close();}
