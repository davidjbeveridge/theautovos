import assert from 'node:assert/strict';
import fs from 'node:fs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({channel:'chrome',headless:true});
const origin=process.env.PROOF_ORIGIN||'http://127.0.0.1:8790';
try {
 const page=await browser.newPage();
 for(const width of [390,768,1440]) {
  await page.setViewportSize({width,height:900});
  await page.goto(origin+'/services/ceramic-coating/');
  const banner=page.locator('.av-xpel');
  assert.equal(await banner.count(),1);
  await banner.scrollIntoViewIfNeeded();
  for(const img of await banner.locator('img').all()) await img.evaluate(i=>i.decode());
  assert.equal(await banner.locator('.av-xpel-product').count(),3);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await banner.screenshot({path:`design-artifacts/site/xpel-${width}.png`});
  await banner.locator('a').first().focus();
  assert.ok(await banner.locator('a').first().evaluate(e=>e===document.activeElement));
 }
 for(const path of fs.readdirSync('dist-demo',{recursive:true}).filter(p=>p.endsWith('.html'))) {
  const html=fs.readFileSync('dist-demo/'+path,'utf8');
  if(!html.includes('<main'))continue;
  assert.equal((html.match(/id="xpel-heading"/g)||[]).length,1,path);
 }
 console.log('XPEL banner: all generated pages; Chrome mobile/tablet/desktop images, layout and focus passed.');
} finally {await browser.close();}
