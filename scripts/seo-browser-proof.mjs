import fs from 'node:fs';
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.SITE_PREVIEW_URL||'http://127.0.0.1:8790';
const manifest=JSON.parse(fs.readFileSync('design-artifacts/demo-manifest.json'));
const out='design-artifacts/site/seo';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const checks=[],errors=[];
const luminance=color=>color.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
const contrast=(a,b)=>(Math.max(luminance(a),luminance(b))+.05)/(Math.min(luminance(a),luminance(b))+.05);
try{
 const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
 await context.route('**/*',r=>new URL(r.request().url()).origin===new URL(base).origin?r.continue():r.abort());
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 for(const p of [...manifest.pages,{path:'/404.html'}]){
  await page.goto(base+p.path);const state=await page.evaluate(()=>{
   const scripts=document.querySelectorAll('script[type="application/ld+json"]');if(scripts.length!==1)throw Error('Expected one JSON-LD graph');const graph=JSON.parse(scripts[0].textContent)['@graph'];
   const image=document.querySelector('meta[property="og:image"]').content;
   const faqs=graph.find(x=>Array.isArray(x['@type'])&&x['@type'].includes('FAQPage'));
   const qs=[...document.querySelectorAll('.av-faq summary')].map(x=>x.textContent.trim());
   return {title:document.title,description:document.querySelector('meta[name=description]').content,robots:document.querySelector('meta[name=robots]').content,graph,ogPath:new URL(image).pathname,faqQuestions:qs,imageWidth:Number(document.querySelector('meta[property="og:image:width"]').content),imageHeight:Number(document.querySelector('meta[property="og:image:height"]').content),overflow:document.documentElement.scrollWidth>innerWidth+1,faqSchema:faqs?.mainEntity.map(x=>x.name)||[]};
  });
  assert(state.description.length>=(p.path==='/404.html'?40:50));assert.equal(state.robots,'noindex,nofollow');assert(!state.overflow,p.path);
  const response=await context.request.get(base+state.ogPath);assert.equal(response.status(),200,state.ogPath);assert(response.headers()['content-type'].includes('image/webp'));
  const dimensions=await page.evaluate(async src=>{const image=new Image();image.src=src;await image.decode();return [image.naturalWidth,image.naturalHeight];},base+state.ogPath);
  assert.deepEqual(dimensions,[state.imageWidth,state.imageHeight],p.path+' declared image dimensions');
  for(const q of state.faqSchema)assert(state.faqQuestions.includes(q),q);
  checks.push({path:p.path,title:state.title,description:state.description,types:state.graph.map(n=>n['@type']),sharingImage:state.ogPath,status:'passed'});
 }
 for(const width of [390,768,1440]){
  for(const p of checks.filter(p=>p.types?.includes('Article'))){await page.setViewportSize({width,height:900});await page.goto(base+p.path);assert.equal(await page.locator('.site-article-byline').count(),1);const credit=await page.locator('.site-article-byline').evaluate(el=>({dark:!!el.closest('.site-split-header'),color:getComputedStyle(el).color,link:getComputedStyle(el.querySelector('a')).color,background:el.closest('.site-split-header')?getComputedStyle(el.closest('.site-split-header')).backgroundColor:''}));if(credit.dark){assert(contrast(credit.color,credit.background)>=4.5,'Byline text contrast');assert(contrast(credit.link,credit.background)>=4.5,'Byline link contrast');}assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,p.path+' byline at '+width);if(p.path==='/resources/porsche-targa-rear-window-tint-installation/'&&[390,1440].includes(width))await page.locator('.site-split-header').screenshot({path:`design-artifacts/social-metadata-audit/article-credit-${width}.png`});}
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
