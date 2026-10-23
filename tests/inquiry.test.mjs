import {test} from 'node:test';import assert from 'node:assert/strict';import {handleInquiry,productionDependencies,RECIPIENT} from '../server/inquiry.mjs';
const origin='https://www.theautovos.com';const valid={name:'Demo Visitor',email:'visitor@example.com',phone:'',reply:'email',service:'ppf',vehicle:'2024 Porsche 911',message:'Sample inquiry only.',consent:true,token:'test'};
const req=(data=valid,headers={},method='POST')=>new Request(origin+'/api/inquiry',{method,headers:{origin,'content-type':'application/json',...headers},...(method==='GET'?{}:{body:JSON.stringify(data)})});
const deps={origin,verifySpam:async()=>true,limit:async()=>true,deliver:async()=>({accepted:true})};
test('all five services/inquiry options accept only through transport; recipient fixed, source bounded',async()=>{for(const service of ['tint','ppf','ceramic','windshield','general']){let lead;const response=await handleInquiry(req({...valid,service,to:'attacker@example.com',context:{landing:'/services/',utm_source:'search',utm_campaign:'email@example.com',secret:'no',referrer:'google.com'}}),{...deps,deliver:async value=>{lead=value;return {accepted:true};}});assert.equal(response.status,200);assert.equal(lead.to,RECIPIENT);assert.deepEqual(lead.source,{utm_source:'search',landing:'/services/',referrer:'google.com'});assert.equal((await response.json()).state,'accepted');}});
test('rejects invalid schema, injection and missing reply permission before delivery',async()=>{for(const change of [{vehicle:''},{vehicle:'   '},{vehicle:42},{vehicle:'x'.repeat(121)},{name:''},{service:'choose'},{service:'anything'},{service:'art'},{reply:'sms'},{email:'ok@example.com\r\nBcc: bad@example.com'},{consent:false},{message:42},{message:'x'.repeat(2001)},{reply:'phone',phone:'123'}]){let called=false;const r=await handleInquiry(req({...valid,...change}),{...deps,deliver:async()=>{called=true;return {accepted:true};}});assert.equal(r.status,422);assert.equal(called,false);}});
test('phone route does not require email',async()=>{assert.equal((await handleInquiry(req({...valid,email:'',phone:'719-555-0100',reply:'phone'}),deps)).status,200);});
test('method, type, origin, oversized and malformed bodies fail closed',async()=>{assert.equal((await handleInquiry(req(valid,{},'GET'),deps)).status,405);assert.equal((await handleInquiry(req(valid,{'content-type':'text/plain'}),deps)).status,415);assert.equal((await handleInquiry(req(valid,{origin:'https://evil.example'}),deps)).status,403);assert.equal((await handleInquiry(req({...valid,message:'x'.repeat(13000)}),deps)).status,413);assert.equal((await handleInquiry(req(null),deps)).status,400);});
test('honeypot, rate limit, spam and unavailable config never send',async()=>{assert.equal((await handleInquiry(req({...valid,website:'spam'}),deps)).status,400);assert.equal((await handleInquiry(req(),{...deps,limit:async()=>false})).status,429);assert.equal((await handleInquiry(req(),{...deps,verifySpam:async()=>false})).status,400);assert.equal((await handleInquiry(req(),{...deps,available:false})).status,503);});
test('failure, uncertainty and demo have distinct truthful states',async()=>{for(const [deliver,state]of [[async()=>({accepted:false}),'failed'],[async()=>{throw Error('timeout');},'uncertain']])assert.equal((await (await handleInquiry(req(),{...deps,deliver})).json()).state,state);assert.equal((await (await handleInquiry(req(),{...deps,demo:true})).json()).state,'simulated');});
const env={SITE_ORIGIN:origin,TURNSTILE_SECRET:'unit-test-only',RESEND_API_KEY:'unit-test-only',MAIL_FROM:'Auto Vos <forms@example.com>',INQUIRY_RATE_LIMITER:{limit:async()=>({success:true})}};
test('provider adapter verifies hostname and action, uses fixed recipient and verified sender',async()=>{const calls=[];const adapter=productionDependencies(env,async(url,options)=>{calls.push({url,options});return Response.json(url.includes('siteverify')?{success:true,hostname:'www.theautovos.com',action:'inquiry'}:{id:'test-provider-id'});});assert.equal(await adapter.verifySpam('x',req()),true);await adapter.deliver({...valid,id:'test-id',source:{}});const payload=JSON.parse(calls[1].options.body);assert.deepEqual(payload.to,[RECIPIENT]);assert.equal(payload.from,env.MAIL_FROM);assert.equal(payload.reply_to,valid.email);assert.equal(payload.html,undefined);for(const mismatch of [{hostname:'evil.example',action:'inquiry'},{hostname:'www.theautovos.com',action:'login'}]){const d=productionDependencies(env,async()=>Response.json({success:true,...mismatch}));assert.equal(await d.verifySpam('x',req()),false);}});
test('missing rate binding/config disables production; upstream 500 is uncertain',async()=>{assert.equal(productionDependencies({}).available,false);const d=productionDependencies(env,async()=>new Response('',{status:500}));await assert.rejects(d.deliver({...valid,id:'id',source:{}}));});

test('Cloudflare delivery fixes the destination and requires an actual provider receipt',async()=>{
 const calls=[];const cf={...env,MAIL_PROVIDER:'cloudflare',RESEND_API_KEY:undefined,INQUIRY_EMAIL:{send:async body=>{calls.push(body);return {messageId:'provider-receipt'};}}};
 const adapter=productionDependencies(cf);assert.equal(adapter.available,true);
 assert.deepEqual(await adapter.deliver({...valid,to:'attacker@example.com',id:'test-reference',source:{},vehicle:'2024 Porsche 911',timing:'Next month'}),{accepted:true});
 assert.equal(calls.length,1);assert.deepEqual(calls[0].to,[RECIPIENT]);assert.equal(calls[0].from,env.MAIL_FROM);assert.equal(calls[0].replyTo,valid.email);assert.equal(calls[0].reply_to,undefined);assert.match(calls[0].text,/2024 Porsche 911/);assert.match(calls[0].text,/test-reference/);
 const noEmail={...valid,email:'',reply:'phone',phone:'719-555-0100',id:'phone-reference',source:{}};
 await adapter.deliver(noEmail);assert.equal(calls[1].replyTo,undefined);
 assert.equal(productionDependencies({...cf,INQUIRY_EMAIL:undefined}).available,false);
 assert.equal(productionDependencies({...cf,MAIL_PROVIDER:'typo'}).available,false);
 await assert.rejects(productionDependencies({...cf,INQUIRY_EMAIL:{send:async()=>({})}}).deliver(noEmail));
});
test('Cloudflare explicit rejection and ambiguous errors preserve truthful delivery states',async()=>{
 const cf={...env,MAIL_PROVIDER:'cloudflare'};
 for(const code of ['E_SENDER_NOT_VERIFIED','E_DELIVERY_FAILED','E_DAILY_LIMIT_EXCEEDED','E_RECIPIENT_SUPPRESSED']){
  const adapter=productionDependencies({...cf,INQUIRY_EMAIL:{send:async()=>{throw Object.assign(Error('provider'),{code});}}});
  assert.deepEqual(await adapter.deliver({...valid,id:'reference',source:{}}),{accepted:false});
 }
 const uncertain=productionDependencies({...cf,INQUIRY_EMAIL:{send:async()=>{throw Error('connection closed');}}});
 await assert.rejects(uncertain.deliver({...valid,id:'reference',source:{}}));
});


test('a free-text vehicle is required, while a blank or omitted message can be delivered',async()=>{
 for(const message of ['', '   ', undefined]){
  let lead;
  const response=await handleInquiry(req({...valid,vehicle:'My Porsche',message}),{...deps,deliver:async value=>{lead=value;return {accepted:true};}});
  assert.equal(response.status,200);
  assert.equal(lead.vehicle,'My Porsche');
  assert.equal(lead.message,'');
 }
 let sent=false;
 const response=await handleInquiry(req({...valid,vehicle:undefined}),{...deps,deliver:async()=>{sent=true;return {accepted:true};}});
 assert.equal(response.status,422);
 assert.match((await response.json()).errors.vehicle,/vehicle/);
 assert.equal(sent,false);
});
