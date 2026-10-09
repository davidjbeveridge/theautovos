import fs from 'node:fs';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const exec=promisify(execFile);
// curl uses the host's working TLS/network stack; Node fetch times out on this host.
async function fetch(url,options={}){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'auto-vos-proof-'));
 try{const args=['--silent','--show-error','--max-time','20','--dump-header',dir+'/headers','--output',dir+'/body','--write-out','%{http_code}'];
 if(options.method)args.push('--request',options.method);
 for(const [name,value] of Object.entries(options.headers||{}))args.push('--header',`${name}: ${value}`);
 if(options.body)args.push('--data-binary',options.body);
 args.push(url);const {stdout}=await exec('/usr/bin/curl',args);
 const blocks=fs.readFileSync(dir+'/headers','utf8').trim().split(/\r?\n\r?\n/);
 const headers=new Headers();for(const line of blocks.at(-1).split(/\r?\n/).slice(1)){const i=line.indexOf(':');if(i>0)headers.append(line.slice(0,i),line.slice(i+1).trim());}
 return new Response(fs.readFileSync(dir+'/body'),{status:Number(stdout),headers});
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
}
const m=JSON.parse(fs.readFileSync('design-artifacts/hosted-demo-manifest.json'));
const base=m.config.origin,checks=[];
async function get(path,status=200){
 const r=await fetch(base+path,{redirect:'manual',signal:AbortSignal.timeout(20000)});
 assert.equal(r.status,status,path);
 assert(r.headers.get('x-robots-tag')?.includes('noindex'),path+' noindex');
 assert.equal(r.headers.get('cache-control'),'no-store',path+' no-store');
 checks.push({path,status});return r;
}
for(const p of m.pages){const text=await(await get(p.path)).text();assert(text.includes('content="noindex,nofollow"'));assert(text.includes(`rel="canonical" href="${base+p.path}"`));assert(!/Automotive art|automotive art|service=art|href="\/art\/"/.test(text));}
for(const p of m.redirects){const r=await get(p.from,301);assert.equal(r.headers.get('location'),p.to);}
for(const p of [...m.retire,'/assets/porsche-art.webp','/assets/migrated/art-1.jpg','/missing-page','/wrangler.demo.jsonc','/server/inquiry.mjs','/design/rebuild-plan.md','/proposal/','/.env','/api/unknown'])await get(p,404);
for(let i=0;i<m.assets.length;i+=8)await Promise.all(m.assets.slice(i,i+8).map(p=>get(p)));
assert((await(await get('/robots.txt')).text()).includes('Disallow: /'));
await get('/llms.txt');await get('/sitemap.xml');
const payload={name:'Synthetic preview test',reply:'email',email:'test@example.com',service:'general',message:'Synthetic demo test. No email requested.',consent:true,token:'local-demo'};
async function submit(origin,body){return fetch(base+'/api/inquiry',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(body)});}
const wrong=await submit('https://example.com',payload);assert.equal(wrong.status,403);checks.push({id:'cross-origin-rejected'});
const invalid=await submit(base,{});assert.equal(invalid.status,422);checks.push({id:'validation'});
const art=await submit(base,{...payload,service:'art'});assert.equal(art.status,422);checks.push({id:'removed-art-service-rejected'});
const result=await submit(base,payload);assert.equal(result.status,200);assert.equal((await result.json()).state,'simulated');checks.push({id:'simulated-no-delivery'});
fs.writeFileSync('design-artifacts/site/hosted-demo-proof.json',JSON.stringify({origin:base,verifiedAt:new Date().toISOString(),checks,form:'Simulation only. No email sent.'},null,2));
console.log(`${checks.length} hosted HTTPS checks passed.`);
