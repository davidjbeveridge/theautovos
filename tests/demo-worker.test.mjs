import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../server/demo-worker.mjs';
const origin='https://7c4e9a.demos.beveridge.io';
const data={name:'Sample',email:'test@example.com',reply:'email',service:'tint',message:'Sample only',consent:true,token:'local-demo'};
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
