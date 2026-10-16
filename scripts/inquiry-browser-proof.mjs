// Local browser regression only. Both Turnstile and email transport are fixtures.
// This cannot establish real anti-spam verification, provider delivery or inbox receipt.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {pageData,render} from '../src/site/pages.mjs';
import {quotePath} from '../src/site/content.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.SITE_URL||'http://127.0.0.1:8790';
if(!/^http:\/\/127\.0\.0\.1:\d+$/.test(base))throw Error('This fixture proof must run against a local preview');
const config={demo:true,hostedDemo:true,inquiryMode:'live',mailProvider:'cloudflare',origin:'https://7c4e9a.demos.beveridge.io',shop:'https://www.theautovos.com/shop',turnstileSiteKey:'browser-fixture',analyticsId:''};
const html=render(pageData(config).find(p=>p.path===quotePath),config);
const browser=await chromium.launch({channel:'chrome',headless:true}),checks=[];
fs.mkdirSync('design-artifacts/live-inquiry',{recursive:true});
try{
 for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});let responseState='failed',calls=[];
  await page.route('**/*',async route=>{
   const url=new URL(route.request().url());
   if(url.hostname==='challenges.cloudflare.com')return route.fulfill({contentType:'text/javascript',body:'window.turnstile={reset(){window.resetCount=(window.resetCount||0)+1;}};'});
   if(url.origin!==base)return route.abort();
   if(url.pathname===quotePath)return route.fulfill({contentType:'text/html',body:html});
   if(url.pathname==='/api/inquiry'){
    calls.push(route.request().postDataJSON());return route.fulfill({status:responseState==='accepted'?200:502,contentType:'application/json',body:JSON.stringify({state:responseState,message:responseState==='accepted'?'Your inquiry was accepted for delivery.':'Your inquiry could not be sent. Your details are still here.',...(responseState==='accepted'?{id:'browser-fixture-reference'}:{})})});
   }
   return route.continue();
  });
  await page.goto(base+quotePath+'?service=windshield&make=Porsche');
  assert.equal(await page.locator('#service').inputValue(),'windshield');assert.equal(await page.locator('#vehicle').inputValue(),'Porsche');
  assert(await page.locator('.site-demo').textContent().then(t=>t.includes('Quote requests are sent')));
  await page.locator('#name').fill('Local browser fixture');await page.locator('#email').fill('fixture@example.com');await page.locator('#message').fill('Local fixture. No actual message sent.');await page.locator('#consent').check();
  await page.locator('#send').click();assert.match(await page.locator('#form-status').textContent(),/complete the spam check/);assert.equal(calls.length,0);
  await page.evaluate(()=>{const input=document.createElement('input');input.type='hidden';input.name='cf-turnstile-response';input.value='fixture-only-token';document.querySelector('.cf-turnstile').append(input);});
  await page.locator('#send').click();await page.waitForFunction(()=>document.querySelector('#form-status').textContent.includes('could not be sent'));
  assert.equal(await page.locator('#message').inputValue(),'Local fixture. No actual message sent.');assert.equal(await page.locator('#send').isEnabled(),true);assert.equal(await page.evaluate(()=>window.resetCount),1);
  responseState='accepted';await page.locator('#send').click();await page.waitForFunction(()=>document.querySelector('#send').textContent==='Inquiry accepted');
  assert.equal(await page.locator('#send').isDisabled(),true);assert.equal(calls.length,2);assert.equal(calls[1].token,'fixture-only-token');assert.equal(calls[1].service,'windshield');assert.equal(calls[1].vehicle,'Porsche');assert.equal(calls[1]['cf-turnstile-response'],undefined);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.locator('#inquiry').screenshot({path:`design-artifacts/live-inquiry/form-fixture-${width}.png`});
  checks.push({width,status:'passed',checks:['real-mode labels','service and vehicle context','missing spam check blocks submission','failed delivery preserves fields','spam widget resets on retry','accepted delivery disables duplicate submission','no horizontal overflow']});await page.close();
 }
 fs.writeFileSync('design-artifacts/live-inquiry/browser-proof.json',JSON.stringify({checks,limits:'Local fixtures only. Turnstile and email responses mocked; no actual delivery.'},null,2));console.log('Live-form UI fixtures passed at 390px and 1440px; no email sent.');
}finally{await browser.close();}
