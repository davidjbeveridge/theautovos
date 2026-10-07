import fs from 'node:fs';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:'playwright');
const browser=await chromium.launch({channel:'chrome',headless:true});
const checks=[];
try {
 for(const width of [1440,390,360]) for(const route of ['/templates/quote.html','/design-system/']) {
  const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});
  await page.goto((process.env.PREVIEW_URL||'http://127.0.0.1:8787')+route);
  await page.keyboard.press('Tab');
  assert.equal(await page.locator('.av-skip').evaluate(el=>document.activeElement===el&&getComputedStyle(el).clipPath==='none'),true);
  await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'main');
  const snapshot=route.includes('quote')?await page.locator('#message').ariaSnapshot():'Catalog skip-link focus verified';
  if(route.includes('quote')) assert.match(snapshot,/textbox "What do you have in mind\?/);
  checks.push({id:`keyboard-accessibility-${route}-${width}`,status:'passed',detail:snapshot});
  await page.close();
 }
 fs.writeFileSync('design-artifacts/accessibility-review.json',JSON.stringify({browser:'Google Chrome',checks,limits:'Targeted keyboard and accessibility-tree evidence, not a screen-reader audit.'},null,2));
 console.log(JSON.stringify(checks));
} finally {await browser.close();}
