import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../server/worker.mjs';
import {pageData,render} from '../src/site/pages.mjs';
import {agentReference} from '../src/site/agent-reference.mjs';

const origin='https://theautovos.com';
test('canonical redirect preserves paths and queries for www and HTTP without fetching assets',async()=>{
 const env={SITE_ORIGIN:origin,ASSETS:{fetch(){throw Error('Must redirect before assets');}}};
 for(const source of ['https://www.theautovos.com/resources/ppf-cost-guide/?utm_source=google','http://theautovos.com/resources/ppf-cost-guide/?utm_source=google','http://www.theautovos.com/resources/ppf-cost-guide/?utm_source=google']){
  const response=await worker.fetch(new Request(source),env);
  assert.equal(response.status,308);assert.equal(response.headers.get('location'),origin+'/resources/ppf-cost-guide/?utm_source=google');
 }
});
test('apex is indexable while temporary Worker staging and owner previews remain excluded',async()=>{
 const env={SITE_ORIGIN:origin,ASSETS:{fetch:async()=>new Response('Page',{headers:{'content-type':'text/html'}})}};
 const live=await worker.fetch(new Request(origin+'/'),env);assert.equal(live.status,200);assert.equal(live.headers.get('x-robots-tag'),null);
 const staged=await worker.fetch(new Request('https://auto-vos-site.example.workers.dev/'),env);assert.equal(staged.status,200);assert.match(staged.headers.get('x-robots-tag'),/noindex/);
});
test('production pages expose apex discovery, the real form and the store in both menus without a preview notice',()=>{
 const config={demo:false,inquiryMode:'live',mailProvider:'cloudflare',origin,shop:'https://shop.theautovos.com/',turnstileSiteKey:'0xProductionFixture'};
 const pages=pageData(config);
 for(const page of pages){
  const html=render(page,config);
  assert.doesNotMatch(html,/class="site-demo"|Website preview|Inquiries are simulated|content="noindex,nofollow"/);
  assert(html.includes(`rel="canonical" href="${origin+page.path}"`));
  assert(html.includes('content="index,follow,max-image-preview:large"'));
  for(const label of ['Main navigation','Mobile navigation']){
   const menu=html.match(new RegExp(`<nav[^>]*aria-label="${label}"[^>]*>([\\s\\S]*?)<\\/nav>`))?.[1];
   assert(menu?.includes('href="https://shop.theautovos.com/"'),page.path+' '+label);
  }
 }
 const quote=render(pages.find(p=>p.path==='/get-a-quote/'),config);
 assert.match(quote,/turnstile\/v0\/api\.js/);assert.doesNotMatch(quote,/Try demo inquiry/);
 const reference=agentReference(pages,config);assert.doesNotMatch(reference,/Environment: isolated client preview|Forms are simulated/);assert(reference.includes('https://theautovos.com/contact/'));
});
