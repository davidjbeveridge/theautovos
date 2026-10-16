import fs from 'node:fs';
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.SITE_PREVIEW_URL||'http://127.0.0.1:8790';
const manifest=JSON.parse(fs.readFileSync('design-artifacts/demo-manifest.json'));
const out='design-artifacts/site/seo';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const checks=[],errors=[];
try{
 const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
 await context.route('**/*',r=>new URL(r.request().url()).origin===new URL(base).origin?r.continue():r.abort());
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 for(const p of manifest.pages){
  await page.goto(base+p.path);const state=await page.evaluate(()=>{
   const graph=JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent)['@graph'];
   const image=document.querySelector('meta[property="og:image"]').content;
   const faqs=graph.find(x=>Array.isArray(x['@type'])&&x['@type'].includes('FAQPage'));
   const qs=[...document.querySelectorAll('.av-faq summary')].map(x=>x.textContent.trim());
   return {title:document.title,description:document.querySelector('meta[name=description]').content,robots:document.querySelector('meta[name=robots]').content,graph,ogPath:new URL(image).pathname,faqQuestions:qs,overflow:document.documentElement.scrollWidth>innerWidth+1,faqSchema:faqs?.mainEntity.map(x=>x.name)||[]};
  });
  assert(state.description.length>=50);assert.equal(state.robots,'noindex,nofollow');assert(!state.overflow,p.path);
  assert.equal((await context.request.get(base+state.ogPath)).status(),200,state.ogPath);
  for(const q of state.faqSchema)assert(state.faqQuestions.includes(q),q);
  checks.push({path:p.path,title:state.title,description:state.description,types:state.graph.map(n=>n['@type']),sharingImage:state.ogPath,status:'passed'});
 }
 for(const width of [390,768,1440]){
  await page.setViewportSize({width,height:900});await page.goto(base+'/services/paint-protection-film/bmw/');
  const proof=page.getByRole('link',{name:'See BMW work and customer photos'});await proof.scrollIntoViewIfNeeded();await proof.focus();await Promise.all([page.waitForURL('**/work/bmw/'),page.keyboard.press('Enter')]);assert(page.url().endsWith('/work/bmw/'));
  await page.goto(base+'/services/window-tint/tesla/');assert.equal(await page.locator('meta[name=description]').getAttribute('content'),'Tesla window tint in Colorado Springs. Compare ceramic film, shade and glass coverage. Get an Auto Vos quote for your car.');
  await page.screenshot({path:`${out}/tesla-tint-${width}.png`,fullPage:true});
  await Promise.all([page.waitForURL('**/get-a-quote/?*'),page.getByRole('link',{name:'Get a quote',exact:true}).last().click()]);assert(page.url().includes('service=tint'));assert.equal(await page.locator('#vehicle').inputValue(),'Tesla');
  checks.push({width,id:'brand-proof-and-context',status:'passed'});
 }
 assert.deepEqual(errors,[]);
 fs.writeFileSync(out+'/browser-proof.json',JSON.stringify({browser:'Google Chrome',checks,errors,limitations:'Local rendered proof; external requests blocked. Not Google rich-result validation, field Core Web Vitals, live ranking or observed AI recommendations.'},null,2));
 console.log(`${checks.length} SEO/brand-journey Chrome checks passed.`);
}finally{await browser.close();}
