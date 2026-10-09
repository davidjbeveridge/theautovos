import fs from 'node:fs';
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({channel:'chrome',headless:true});
const checks=[];
try{
 const page=await browser.newPage();
 for(const width of [390,891,1440]){
  await page.setViewportSize({width,height:900});
  for(const service of ['window-tint','paint-protection-film','ceramic-coating']){
   const path=`/services/${service}/`;await page.goto('http://127.0.0.1:8790'+path);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,path);
   const hero=await page.locator('.av-split-hero img').getAttribute('src');
   const example=await page.locator('.site-service-photo img').getAttribute('src');assert.notEqual(hero,example);
   const diagrams=page.locator('.site-service-diagram');
   for(const diagram of await diagrams.all()){
    const img=diagram.locator('img');await img.scrollIntoViewIfNeeded();await img.evaluate(i=>i.decode());
    const result=await img.evaluate(i=>({loaded:i.naturalWidth>0,alt:i.alt,title:i.title,srcset:i.srcset,ratio:i.clientWidth/i.clientHeight,originalRatio:i.naturalWidth/i.naturalHeight}));
    assert.ok(result.loaded&&result.alt&&result.title&&result.srcset);assert.ok(Math.abs(result.ratio-result.originalRatio)<.02,'Diagram cropped');
    const a=diagram.locator('a').first();await a.focus();await page.keyboard.press('Enter');
    assert.equal(await page.locator('#photo-viewer').evaluate(d=>d.open),true);
    await page.keyboard.press('Tab');assert.ok(await page.locator('#photo-viewer').evaluate(d=>d.contains(document.activeElement)));
    await page.keyboard.press('Escape');assert.equal(await page.locator('#photo-viewer').evaluate(d=>d.open),false);assert.equal(await a.evaluate(a=>document.activeElement===a),true);
   }
   await page.locator('.site-education').screenshot({path:`design-artifacts/site/media-${service}-${width}.png`});
   checks.push({path,width,diagrams:await diagrams.count(),distinctPhoto:true,lightboxKeyboard:true,passed:true});
  }
 }
 for(const service of ['paint-protection-film','ceramic-coating'])for(const brand of ['porsche','bmw','tesla']){
  const path=`/services/${service}/${brand}/`;await page.goto('http://127.0.0.1:8790'+path);
  assert.equal(await page.locator('.site-combination').count(),1);assert.equal(await page.locator('[data-diagram=combination]').count(),1);
  const a=page.locator('.site-combination a[href^="/get-a-quote/"]');const href=await a.getAttribute('href');assert.ok(href.includes('make='+ (brand==='bmw'?'BMW':brand[0].toUpperCase()+brand.slice(1))));
  const faq=page.locator('details').filter({has:page.locator('summary',{hasText:'Can I use PPF and ceramic coating together?'})});assert.equal(await faq.count(),1);await faq.locator('summary').click();assert.match(await faq.innerText(),/Install (?:the )?PPF.*first/);
  checks.push({path,combination:true,quoteContext:true,faq:true,passed:true});
 }
 const nojs=await browser.newPage({javaScriptEnabled:false});await nojs.goto('http://127.0.0.1:8790/services/paint-protection-film/');
 const original=nojs.locator('[data-diagram=ppf]>a');assert.ok((await original.getAttribute('href')).endsWith('.png'));await original.click();assert.ok(nojs.url().endsWith('/assets/diagrams/ppf-layers.png'));checks.push({noJavaScriptOriginalAccessible:true,passed:true});
 fs.writeFileSync('design-artifacts/site/service-media-proof.json',JSON.stringify({browser:'Google Chrome',checks},null,2));console.log(`${checks.length} media, combination, keyboard and fallback checks passed`);
}finally{await browser.close()}
