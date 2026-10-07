import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {pages} from '../src/pages.mjs';
import {pageTypes} from '../src/content.mjs';
const errors=[];const require=(ok,message)=>{if(!ok)errors.push(message);};
const files=[...Object.keys(pages).map(p=>'templates/'+p),'design-system/index.html'];
for(const file of files){
 const text=fs.readFileSync(file,'utf8');
 require((text.match(/<h1\b/g)||[]).length===1,`${file}: expected one h1`);
 require((text.match(/<main\b/g)||[]).length===1,`${file}: expected one main`);
 require(text.includes('noindex,nofollow'),`${file}: must remain noindex`);
 const ids=[...text.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);require(ids.length===new Set(ids).size,`${file}: duplicate IDs`);
 for(const match of text.matchAll(/\b(?:src|href)="([^"]+)"/g)){
  const href=match[1].replaceAll('&amp;','&');if(/^(https?:|tel:|mailto:|data:)/.test(href))continue;
  const [target,hash]=href.split('#');const dest=target?path.normalize(path.join(path.dirname(file),target.split('?')[0])):file;
  require(fs.existsSync(dest),`${file}: missing ${dest}`);
  if(hash&&fs.existsSync(dest)&&dest.endsWith('.html'))require(fs.readFileSync(dest,'utf8').includes(`id="${hash}"`),`${file}: broken fragment ${href}`);
 }
 for(const m of text.matchAll(/<img\b[^>]*>/g))require(/\balt="/.test(m[0]),`${file}: image alt missing`);
 if(file.includes('quote')||file.includes('contact'))require(/type="submit" disabled/.test(text),`${file}: no-script demo submission must be disabled`);
}
const inventory=JSON.parse(fs.readFileSync('design/page-inventory.json'));const familyIds=new Set(pageTypes.map(x=>x[0]));for(const row of inventory.routes)require(familyIds.has(row.template),`Uncovered audited route: ${row.path}`);
require(inventory.routes.length===36,'Expected coverage of all 36 audited routes');
for(const file of ['src/system.css','src/catalog.css','src/components.mjs','src/pages.mjs']){const s=fs.readFileSync(file,'utf8');require(!/tailwind|@apply\b|styled-components|className=|\bsx=/.test(s),`${file}: prohibited styling pattern`);}
// Regeneration must be byte-identical, including generated tokens and scripts.
const generated=[...files,'design-system/tokens.css','design-system/system.css','design-system/catalog.css','design-system/interactions.js','design/template-manifest.json'];
const before=new Map(generated.map(f=>[f,fs.readFileSync(f,'utf8')]));const build=spawnSync(process.execPath,['scripts/build.mjs'],{encoding:'utf8'});require(build.status===0,'Build failed: '+build.stderr);
for(const [file,contents] of before)require(fs.readFileSync(file,'utf8')===contents,`${file}: generated file drift; rebuild source`);
const registry=JSON.parse(fs.readFileSync('design/presentation.yaml'));const css=fs.readFileSync('design-system/tokens.css','utf8');for(const token of registry.variables)require(css.includes(`${token.projections.css.customProperty}: ${token.values.base};`),`Token drift: ${token.id}`);
const original=fs.readFileSync('index.html','utf8');require(!original.includes('Watch the craft'),'Removed hero button returned');require(original.includes('Get a quote'),'Original quote invitation missing');
const result={passed:errors.length===0,generatedPages:20,pageFamilies:16,auditedRoutes:inventory.routes.length,checks:['HTML structure','local links and assets','fragment targets','preview robots','safe no-script form','route coverage','strict-simple source scan','generated drift','token projection','homepage removal preserved'],errors};
fs.mkdirSync('design-artifacts',{recursive:true});fs.writeFileSync('design-artifacts/source-verification.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));assert.equal(errors.length,0,'Source verification failed');
