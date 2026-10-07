import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {pageTypes} from '../src/content.mjs';
const modulePath=process.env.PLAYWRIGHT_MODULE;
const {chromium}=await import(modulePath?pathToFileURL(modulePath).href:'playwright');
const base=process.env.PREVIEW_URL||'http://127.0.0.1:8787';
const out='design-artifacts/proof';fs.mkdirSync(out,{recursive:true});fs.mkdirSync('design-system/previews',{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({reducedMotion:'reduce'});const page=await context.newPage();
const runtimeErrors=[];page.on('pageerror',e=>runtimeErrors.push(e.message));
const reports=[],captures=[],checks=[];
const check=(id,passed,detail='')=>{checks.push({id,passed,detail});assert.ok(passed,`${id}: ${detail}`);};
async function ready(url){await page.goto(base+url);await page.evaluate(async()=>{await document.fonts.ready;for(const i of document.images)i.loading='eager';await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));});}
async function inspect(){return page.evaluate(()=>{
 const visible=el=>el.checkVisibility({checkVisibilityCSS:true,checkOpacity:true,contentVisibilityAuto:true})&&!el.closest('details:not([open]) nav');
 const errors=[];if(document.documentElement.scrollWidth>innerWidth+1)errors.push({kind:'overflow',width:document.documentElement.scrollWidth});
 const h1=document.querySelectorAll('h1');if(h1.length!==1)errors.push({kind:'h1-count',count:h1.length});
 const ids=[...document.querySelectorAll('[id]')].map(el=>el.id);if(new Set(ids).size!==ids.length)errors.push({kind:'duplicate-ids'});
 for(const img of document.images){if(!img.hasAttribute('alt'))errors.push({kind:'missing-alt',src:img.src});if(img.complete&&!img.naturalWidth)errors.push({kind:'broken-image',src:img.src});}
 for(const el of document.querySelectorAll('button,a,input,select,textarea,summary')){if(!visible(el)||el.type==='hidden')continue;const name=el.getAttribute('aria-label')||el.getAttribute('aria-labelledby')||el.innerText||el.querySelector('img')?.alt||el.labels?.[0]?.innerText;if(!name?.trim())errors.push({kind:'unnamed-control',tag:el.tagName,id:el.id});}
 return {width:innerWidth,height:innerHeight,errors};
 });}
try {
 const manifest=JSON.parse(fs.readFileSync('design/template-manifest.json'));
 for(const size of [{width:1440,height:1000},{width:390,height:844},{width:768,height:1024},{width:1024,height:900},{width:360,height:800}]){
  await page.setViewportSize(size);
  for(const {path:file} of manifest.pages){await ready('/'+file);const report=await inspect();reports.push({path:file,...report});
   const family=pageTypes.find(x=>file==='templates/'+x[3]);
   if(family&&(size.width===1440||size.width===390)){
    const shot=`${out}/${family[0]}-${size.width}.png`;await page.screenshot({path:shot,fullPage:true});captures.push({path:shot,url:base+'/'+file,viewport:size,state:'default'});
    if(size.width===1440){await page.screenshot({path:`design-system/previews/${family[0]}.png`});}
   }
  }
 }
 for(const size of [{width:1440,height:1000},{width:390,height:844}]){await page.setViewportSize(size);await ready('/design-system/index.html');await page.evaluate(async()=>{for(const i of document.images){i.loading='eager';}await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));});reports.push({path:'design-system/index.html',...await inspect()});const shot=`${out}/catalog-${size.width}.png`;await page.screenshot({path:shot});captures.push({path:shot,viewport:size,state:'catalog opening'});for(const id of ['foundations','storyboard','components','templates','usage']){const sectionPath=`${out}/catalog-${id}-${size.width}.png`;await page.locator('#'+id).screenshot({path:sectionPath});captures.push({path:sectionPath,viewport:size,state:'catalog '+id});}}
 // Test the local inquiry: invalid -> correction -> transport error -> completion.
 await page.setViewportSize({width:390,height:844});await ready('/templates/quote.html?service=ppf');
 check('service-prefill',await page.locator('#service').inputValue()==='Paint protection film');
 await page.getByRole('button',{name:'Preview request',exact:true}).click();check('validation-summary',await page.locator('[data-error-summary]').isVisible());check('summary-focus',await page.locator('[data-error-summary]').evaluate(el=>document.activeElement===el));
 await page.screenshot({path:`${out}/quote-invalid.png`,fullPage:true});
 for(const [id,value] of Object.entries({year:'2024',make:'Porsche',model:'911',name:'Sample Driver',email:'sample@example.test'}))await page.locator('#'+id).fill(value);
 await page.locator('[name=acknowledge]').check();await page.locator('[data-simulate-error]').check();
 await page.getByRole('button',{name:'Preview request',exact:true}).click();await page.getByText('Your details are still here. Turn off',{exact:false}).waitFor();
 check('error-preserves-input',await page.locator('#model').inputValue()==='911');await page.screenshot({path:`${out}/quote-error.png`,fullPage:true});
 await page.locator('[data-simulate-error]').uncheck();await page.getByRole('button',{name:'Preview request',exact:true}).click();await page.locator('[data-form-success]').waitFor();check('local-confirmation',await page.locator('[data-form-success]').innerText().then(s=>s.includes('Nothing was sent')));await page.screenshot({path:`${out}/quote-complete.png`,fullPage:true});
 check('no-personal-data-storage',await page.evaluate(()=>!JSON.stringify({...localStorage,...sessionStorage}).includes('example.test')));
 // Gallery empty/reset and native FAQ keyboard.
 await ready('/templates/work.html');await page.getByRole('button',{name:'Events',exact:true}).click();check('gallery-empty',await page.locator('[data-gallery-empty]').isVisible());await page.screenshot({path:`${out}/work-empty.png`,fullPage:true});await page.getByRole('button',{name:'Show all work'}).click();check('gallery-reset',await page.locator('[data-gallery-grid] article:visible').count()===6);
 await ready('/templates/service-ppf.html');const summary=page.locator('.av-faq summary').first();await summary.focus();await page.keyboard.press('Enter');check('keyboard-faq',await page.locator('.av-faq details').first().getAttribute('open')!==null);
 // Native mobile navigation.
 await page.locator('.av-mobile-menu summary').focus();await page.keyboard.press('Enter');check('mobile-menu-keyboard',await page.locator('.av-mobile-menu nav').isVisible());
 // Product, bag, update, checkout, remove.
 await ready('/templates/product.html');await page.getByRole('radio',{name:'L',exact:true}).check();await page.locator('#quantity').selectOption('2');await page.getByRole('button',{name:'Add to demo bag'}).click();await page.getByRole('link',{name:'View demo bag',exact:true}).click();check('bag-selection',await page.locator('[data-cart-size]').innerText().then(s=>s.includes('L')));check('bag-subtotal',await page.locator('[data-subtotal]').innerText()==='$70.00');await page.locator('#cart-quantity').selectOption('3');check('bag-update',await page.locator('[data-subtotal]').innerText()==='$105.00');await page.screenshot({path:`${out}/cart-populated.png`,fullPage:true});await page.getByRole('link',{name:'Continue to checkout preview'}).click();check('checkout-summary',await page.locator('[data-checkout-summary]').innerText().then(s=>s.includes('$105.00')));await ready('/templates/cart.html');await page.getByRole('button',{name:'Remove item'}).click();check('bag-empty',await page.locator('[data-cart-empty]').isVisible());
 // No script gives content and direct contact; fake submissions remain disabled.
 const noJS=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});const n=await noJS.newPage();await n.goto(base+'/templates/quote.html');check('no-js-safe-form',await n.locator('[type=submit]').isDisabled());check('no-js-contact',await n.locator('a[href^="tel:"]').count()>0);await noJS.close();
 await ready('/templates/home.html');check('poster-first',await page.locator('#av-film').evaluate(v=>v.paused&&!v.getAttribute('src')));await page.getByRole('button',{name:'Play background film'}).click();await page.waitForFunction(()=>document.querySelector('#av-film').currentTime>0);check('film-playing',await page.locator('#av-film').evaluate(v=>!v.paused));await page.getByRole('button',{name:'Pause background film'}).click();check('film-pauses',await page.locator('#av-film').evaluate(v=>v.paused));
 // Text enlargement and long content retain layout.
 await page.setViewportSize({width:390,height:844});await ready('/templates/quote.html');await page.addStyleTag({content:'body{font-size:200%} input,select,textarea,button{font-size:inherit}'});reports.push({path:'quote text 200%',...await inspect()});await ready('/templates/service-ppf.html');await page.locator('.av-title').first().evaluate(el=>el.textContent='A detailed explanation of paint protection for the vehicle you drive every day.');reports.push({path:'long heading',...await inspect()});
 check('no-runtime-errors',runtimeErrors.length===0,runtimeErrors.join('; '));
 const errors=reports.flatMap(r=>r.errors.map(e=>({...e,path:r.path,viewport:r.width})));
 fs.writeFileSync(`${out}/inspection.json`,JSON.stringify({reports,errors,runtimeErrors},null,2));
 fs.writeFileSync(`${out}/render-manifest.json`,JSON.stringify({browser:'Google Chrome',captures},null,2));
 fs.writeFileSync(`${out}/functional.json`,JSON.stringify({passed:checks.every(c=>c.passed)&&errors.length===0,checks,errors},null,2));
 console.log(JSON.stringify({viewports:5,pages:20,inspections:reports.length,checks:checks.length,errorCount:errors.length,errors:errors.slice(0,10)},null,2));
 assert.equal(errors.length,0,'Runtime layout/semantics defects');
} finally {await browser.close();}
