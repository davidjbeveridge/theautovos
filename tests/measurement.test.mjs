import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../src/site/client.js',import.meta.url),'utf8');
function fixture({consent='yes',mode='production',state='accepted',ok=true,canonical='https://theautovos.com/get-a-quote/'}={}){
 const listeners={},clicks={},scripts=[],storage=new Map([['av-analytics',consent]]);
 const values={name:'Private Person',email:'private@example.com',phone:'7195550199',vehicle:'PRIVATE-VIN-123',message:'Private message',service:'tint',reply:'email',consent:true,'cf-turnstile-response':'private-token'};
 const elements=Object.fromEntries(Object.entries(values).map(([key,value])=>[key,{value,checked:true,validity:{valid:true},addEventListener(){}}]));
 const noop=()=>{};const status={focus:noop};const summary={replaceChildren:noop};const send={};
 const form={elements,querySelectorAll:()=>[],querySelector:()=>({textContent:''}),addEventListener:(key,fn)=>{listeners[key]=fn;}};
 const buttons=['yes','no'].map(value=>({dataset:{consent:value},addEventListener:(key,fn)=>{clicks[value]=fn;}}));
 const choice={hidden:true,querySelector:()=>({focus:noop}),querySelectorAll:()=>buttons};
 const mapButton={dataset:{map:'map-target'},addEventListener:(key,fn)=>{listeners.map=fn;}};
 const document={body:{dataset:{mode,analytics:'G-TEST123',service:'tint',inquiryMode:'live'}},referrer:'https://search.example/path?email=private@example.com',head:{append:s=>scripts.push(s)},
 querySelector:selector=>({'link[rel="canonical"]':canonical?{href:canonical}:null,'#analytics-choice':choice,'#inquiry':form,'#send':send,'#errors':summary,'#form-status':status}[selector]||null),
 querySelectorAll:selector=>selector==='[data-map]'?[mapButton]:[],getElementById:()=>({replaceChildren:noop}),addEventListener:(key,fn)=>{listeners['document:'+key]=fn;},createElement:()=>({})};
 let reloads=0;const window={confirm:()=>true};const location=new URL('https://theautovos.com/private-vin-path?email=private@example.com#PRIVATE-VIN-123');
 location.reload=()=>{reloads++;};
 vm.runInNewContext(source,{document,window,location,URL,URLSearchParams,sessionStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},FormData:class{*[Symbol.iterator](){yield* Object.entries(values);}},fetch:async()=>({ok,json:async()=>({state,id:'private-reference',message:'Result'})}),AbortSignal,console});
 return {window,scripts,choice,clicks,listeners,reloads:()=>reloads,events:()=>Array.from(window.dataLayer||[]).filter(x=>x[0]==='event')};
}
test('analytics stays silent before consent, in previews, and without a trusted canonical URL',async()=>{
 for(const options of [{consent:'no'},{consent:''},{mode:'demo'},{canonical:null},{canonical:'https://other.example/'}]){
  const f=fixture(options);await f.listeners.submit({preventDefault(){}});assert.equal(f.scripts.length,0);assert.equal(f.events().length,0);
 }
});
test('only confirmed HTTP-success acceptance generates one lead; other outcomes generate none',async()=>{
 for(const [state,ok,count] of [['accepted',true,1],['accepted',false,0],['simulated',true,0],['uncertain',true,0],['failed',false,0],['invalid',false,0]]){
  const f=fixture({state,ok});await f.listeners.submit({preventDefault(){}});await f.listeners.submit({preventDefault(){}});
  const leads=f.events().filter(x=>x[1]==='generate_lead');assert.equal(leads.length,count,state+' '+ok);
  if(count)assert.equal(leads[0][2].service,'tint');
 }
});
test('events use published canonical route and omit form answers, references, query strings and fragments',async()=>{
 const f=fixture();await f.listeners.submit({preventDefault(){}});
 for(const row of f.events()){assert.equal(row[2].page_location,'https://theautovos.com/get-a-quote/');assert.equal(row[2].page_path,'/get-a-quote/');}
 const payload=JSON.stringify(f.window.dataLayer);
 for(const secret of ['Private Person','private@example.com','7195550199','PRIVATE-VIN-123','Private message','private-token','private-reference','private-vin-path'])assert(!payload.includes(secret),secret);
 const consent=f.window.dataLayer.find(row=>row[0]==='consent')[2];assert.equal(consent.ad_storage,'denied');assert.equal(consent.ad_user_data,'denied');assert.equal(consent.ad_personalization,'denied');
});
test('phone clicks express intent, duplicate allow does not duplicate views, and withdrawal stops events',()=>{
 const f=fixture();const click=()=>f.listeners['document:click']({target:{closest:()=>({getAttribute:()=> 'tel:7195550199'})}});
 f.clicks.yes();assert.equal(f.events().filter(row=>row[1]==='page_view').length,1);click();assert.equal(f.events().filter(row=>row[1]==='phone_click').length,1);assert.equal(f.events().filter(row=>row[1]==='generate_lead').length,0);
 f.clicks.no();click();assert.equal(f.events().filter(row=>row[1]==='phone_click').length,1);assert.equal(f.window['ga-disable-G-TEST123'],true);assert.equal(f.reloads(),1);assert.equal(f.window.dataLayer.filter(row=>row[0]==='consent'&&row[1]==='update').at(-1)[2].analytics_storage,'denied');
});

test('form start, email and directions clicks are intent events without target details',()=>{
 const f=fixture();f.listeners.input();f.listeners.input();
 const click=href=>f.listeners['document:click']({target:{closest:()=>({getAttribute:()=>href,hasAttribute:()=>false})}});
 click('mailto:private@example.com');click('https://www.google.com/maps/search/?api=1&query=private-address');
 for(const name of ['form_start','email_click','directions_click'])assert.equal(f.events().filter(row=>row[1]===name).length,1);
 const payload=JSON.stringify(f.window.dataLayer);assert(!payload.includes('private-address'));assert(!payload.includes('private@example.com'));
});
test('arbitrary campaign values and referrer host are excluded from analytics',()=>{
 const f=fixture();const payload=JSON.stringify(f.window.dataLayer);assert(!payload.includes('search.example'));assert(!payload.includes('private@example.com'));
});

test('loading the map records intent without sending its address',()=>{const f=fixture();f.listeners.map();assert.equal(f.events().filter(row=>row[1]==='map_open').length,1);assert(!JSON.stringify(f.window.dataLayer).includes('Spectra'));});

test('canceling the reload warning preserves current consent and form state',()=>{const f=fixture();f.window.confirm=()=>false;f.clicks.no();assert.equal(f.reloads(),0);assert.notEqual(f.window['ga-disable-G-TEST123'],true);assert.equal(f.window.dataLayer.filter(x=>x[0]==='consent'&&x[1]==='update').length,0);});

test('initial denial requires no reload and later fresh consent loads analytics',()=>{const f=fixture({consent:''});f.clicks.no();assert.equal(f.reloads(),0);assert.equal(f.scripts.length,0);f.clicks.yes();assert.equal(f.scripts.length,1);assert.equal(f.events().filter(x=>x[1]==='page_view').length,1);});
