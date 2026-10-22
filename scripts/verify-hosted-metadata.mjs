// Read-only release proof. Uses ordinary HTTPS, valid TLS, and no live inquiries.
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import assert from 'node:assert/strict';import {execFile} from 'node:child_process';import {promisify} from 'node:util';
const exec=promisify(execFile),checks=[];
async function request(url,userAgent){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'auto-vos-meta-'));try{const args=['--silent','--show-error','--compressed','--max-time','25','--retry','1','--retry-all-errors','--dump-header',dir+'/headers','--output',dir+'/body','--write-out','%{http_code}'];if(userAgent)args.push('--user-agent',userAgent);args.push(url);const {stdout}=await exec('/usr/bin/curl',args);return {status:Number(stdout),body:fs.readFileSync(dir+'/body'),headers:fs.readFileSync(dir+'/headers','utf8').toLowerCase()};}finally{fs.rmSync(dir,{recursive:true,force:true});}}
for(const [mode,dist] of [['production','dist-production'],['hosted-demo','dist-hosted-demo']]){
 const manifest=JSON.parse(fs.readFileSync(`design-artifacts/${mode}-manifest.json`)),base=manifest.config.origin,images=new Set();
 const pages=[...manifest.pages,{path:'/404.html'}];
 for(let i=0;i<pages.length;i+=6)await Promise.all(pages.slice(i,i+6).map(async p=>{
  const requestedPath=p.path==='/404.html'?'/metadata-audit-missing-page/':p.path,r=await request(base+requestedPath),file=p.path==='/'?'index.html':p.path==='/404.html'?'404.html':p.path.slice(1)+'index.html';
  assert.equal(r.status,p.path==='/404.html'?404:200,base+p.path);assert(r.headers.includes('content-type: text/html'));assert(r.body.equals(fs.readFileSync(dist+'/'+file)),base+p.path+' differs from merged build');
  const html=r.body.toString();assert.equal(r.headers.includes('x-robots-tag: noindex'),mode==='hosted-demo');assert.equal(html.includes('class="site-demo"'),mode==='hosted-demo');assert.equal((html.match(/<form id="inquiry"/g)||[]).length,1);
  const graph=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);assert.equal(graph['@context'],'https://schema.org');assert(html.includes(`rel="canonical" href="${base+p.path}"`));
  const image=html.match(/<meta property="og:image" content="([^"]+)"/)[1];assert.equal(new URL(image).origin,base);images.add(new URL(image).pathname);checks.push({mode,path:p.path,requestedPath,status:r.status,exactBuild:true,metadataGraph:true});
 }));
 const paths=[...images,'/site/style.css','/site/client.js','/robots.txt','/llms.txt','/sitemap.xml'];
 for(let i=0;i<paths.length;i+=6)await Promise.all(paths.slice(i,i+6).map(async p=>{const r=await request(base+p);assert.equal(r.status,200,base+p);assert(r.body.equals(fs.readFileSync(dist+p)),base+p+' asset differs');if(images.has(p))assert(r.headers.includes('content-type: image/webp'),base+p);checks.push({mode,path:p,exactBuild:true});}));
 if(mode==='production')for(const agent of ['facebookexternalhit/1.1','Twitterbot/1.0','LinkedInBot/1.0'])for(const route of ['/','/contact/','/resources/porsche-targa-rear-window-tint-installation/']){
  const r=await request(base+route,agent),file=route==='/'?'index.html':route.slice(1)+'index.html';assert.equal(r.status,200,agent+' '+route);assert(r.body.equals(fs.readFileSync(dist+'/'+file)),agent+' altered page');checks.push({mode,path:route,userAgent:agent,status:200,exactBuild:true});
 }
}
const {stdout:revision}=await exec('git',['rev-parse','HEAD']);fs.mkdirSync('design-artifacts/social-metadata-audit',{recursive:true});fs.writeFileSync('design-artifacts/social-metadata-audit/hosted-proof.json',JSON.stringify({sourceCommit:revision.trim(),verifiedAt:new Date().toISOString(),transport:'Ordinary unforced curl HTTPS; valid TLS; public GETs only',checks,limits:'Confirms served metadata and assets, not social-platform cache refresh, live rich-result eligibility or rankings. No email sent.'},null,2)+'\n');console.log(`${checks.length} hosted metadata, image, discovery and social-crawler checks passed on production and preview.`);
