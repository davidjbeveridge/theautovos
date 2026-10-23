import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../server/demo-worker.mjs';
const origin='https://7c4e9a.demos.beveridge.io';
const data={name:'Sample',email:'test@example.com',reply:'email',service:'tint',vehicle:'2024 Porsche 911',message:'Sample only',consent:true,token:'local-demo'};
const env={SITE_ORIGIN:origin,INQUIRY_RATE_LIMITER:{limit:async()=>({success:true})},ASSETS:{fetch:async()=>new Response('Asset',{status:200})}};
function req(body=data,source=origin){return new Request(origin+'/api/inquiry',{method:'POST',headers:{origin:source,'content-type':'application/json','cf-connecting-ip':'192.0.2.1'},body:JSON.stringify(body)});}
test('hosted preview simulates without any external provider or persistence binding',async()=>{
 const r=await worker.fetch(req(),env);assert.equal(r.status,200);const body=await r.json();assert.equal(body.state,'simulated');assert.match(body.message,/No email was sent/);assert.equal(r.headers.get('cache-control'),'no-store');assert.match(r.headers.get('x-robots-tag'),/noarchive/);
});
test('hosted preview enforces origin, validation, token and rate limits',async()=>{
 assert.equal((await worker.fetch(req(data,'https://example.com'),env)).status,403);
 assert.equal((await worker.fetch(req({}),env)).status,422);
 assert.equal((await worker.fetch(req({...data,token:'bad'}),env)).status,400);
 assert.equal((await worker.fetch(req(),{...env,INQUIRY_RATE_LIMITER:{limit:async()=>({success:false})}})).status,429);
 assert.equal((await worker.fetch(req(),{...env,INQUIRY_RATE_LIMITER:undefined})).status,503);
});
test('preview headers also cover static redirects and error responses',async()=>{
 for(const status of [200,301,404]){const r=await worker.fetch(new Request(origin+'/example'),{...env,ASSETS:{fetch:async()=>new Response('Asset',{status})}});assert.equal(r.status,status);assert.match(r.headers.get('x-robots-tag'),/noindex/);assert.equal(r.headers.get('cache-control'),'no-store');}
 const r=await worker.fetch(new Request(origin+'/api/unknown'),env);assert.equal(r.status,404);assert.match(r.headers.get('x-robots-tag'),/noindex/);
});

test('live preview never falls back to simulation when delivery is unconfigured',async()=>{
 const response=await worker.fetch(req(),{...env,INQUIRY_MODE:'live'});
 assert.equal(response.status,503);assert.equal((await response.json()).state,'unavailable');assert.match(response.headers.get('x-robots-tag'),/noindex/);
});

test('live preview verifies Turnstile and sends exactly once to the fixed mailbox',async t=>{
 const sent=[];t.mock.method(globalThis,'fetch',async(url,options)=>{
  assert.equal(url,'https://challenges.cloudflare.com/turnstile/v0/siteverify');assert.equal(options.body.get('response'),'real-token');
  return Response.json({success:true,hostname:new URL(origin).hostname,action:'inquiry'});
 });
 const live={...env,INQUIRY_MODE:'live',MAIL_PROVIDER:'cloudflare',MAIL_FROM:'Auto Vos <forms@example.com>',TURNSTILE_SECRET:'unit-test-only',INQUIRY_EMAIL:{send:async message=>{sent.push(message);return {messageId:'provider-id'};}}};
 const bad=await worker.fetch(req(),live);assert.equal(bad.status,400);assert.equal(sent.length,0);
 const response=await worker.fetch(req({...data,token:'real-token',to:'bad@example.com',vehicle:'2024 Porsche 911'}),live);
 assert.equal(response.status,200);assert.equal((await response.json()).state,'accepted');assert.match(response.headers.get('x-robots-tag'),/noindex/);
 assert.equal(sent.length,1);assert.deepEqual(sent[0].to,['theautovos@gmail.com']);assert.equal(sent[0].replyTo,data.email);assert.match(sent[0].text,/2024 Porsche 911/);
 assert.equal((await worker.fetch(req(),{...live,INQUIRY_MODE:'typo'})).status,503);
});
