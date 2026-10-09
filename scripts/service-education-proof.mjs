import fs from 'node:fs';
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({channel:'chrome',headless:true});const checks=[];
try{
 const page=await browser.newPage();
 for(const width of [390,768,905,1024,1440]){
  await page.setViewportSize({width,height:900});await page.goto('http://127.0.0.1:8790/');
  const positions=await page.locator('.av-service-card>p').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().top));
  if(width>600)assert.ok(Math.max(...positions)-Math.min(...positions)<1,JSON.stringify({width,positions}));
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  if(width===905)await page.locator('.av-service-grid').screenshot({path:'design-artifacts/site/service-cards-aligned.png'});
  checks.push({width,paragraphTops:positions,passed:true});
 }
 const manifest=JSON.parse(fs.readFileSync('design-artifacts/demo-manifest.json'));
 const paths=manifest.pages.map(p=>typeof p==='string'?p:p.path).filter(p=>p.startsWith('/services/')&&p!='/services/');
 for(const path of paths){await page.goto('http://127.0.0.1:8790'+path);assert.equal(await page.locator('.site-education').count(),1,path);const section=page.locator('.site-service-questions');assert.equal(await section.count(),1,path);assert.ok(await section.locator('details').count()>=12,path);const first=section.locator('summary').first();await first.focus();await page.keyboard.press('Enter');assert.equal(await section.locator('details').first().evaluate(d=>d.open),true);checks.push({path,questions:await section.locator('details').count(),passed:true});}
 await page.goto('http://127.0.0.1:8790/services/ceramic-coating/');await page.locator('.site-education').screenshot({path:'design-artifacts/site/ceramic-education.png'});
 fs.writeFileSync('design-artifacts/site/service-education-proof.json',JSON.stringify({browser:'Google Chrome',checks},null,2));console.log(`${checks.length} service education and alignment checks passed`);
}finally{await browser.close()}
