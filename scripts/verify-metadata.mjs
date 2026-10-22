// Full static heads and graph audit; Chrome DOM/image checks are separate.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {textOnly} from '../src/site/seo.mjs';
const checks=[];
for(const [mode,dist] of [['demo','dist-demo'],['hosted-demo','dist-hosted-demo'],['production','dist-production']]){
 const manifest=JSON.parse(fs.readFileSync(`design-artifacts/${mode}-manifest.json`));
 const titles=new Set(),descriptions=new Set(),assets=new Set(manifest.assets);
 for(const p of [...manifest.pages,{path:'/404.html'}]){
  const file=p.path==='/'?'index.html':p.path==='/404.html'?'404.html':p.path.slice(1)+'index.html';
  const html=fs.readFileSync(`${dist}/${file}`,'utf8'),head=html.match(/<head>([\s\S]*?)<\/head>/)?.[1];assert(head,p.path);
  const tags=[...head.matchAll(/<meta\b[^>]*>/g)].map(([tag])=>Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map(([,key,value])=>[key,textOnly(value)])));
  const get=key=>{const matches=tags.filter(t=>(t.property||t.name)===key);assert.equal(matches.length,1,mode+p.path+' '+key);assert(matches[0].content,mode+p.path+' empty '+key);return matches[0].content;};
  const title=textOnly(head.match(/<title>([\s\S]*?)<\/title>/)?.[1]||'');assert(title&&!titles.has(title),p.path+' title');titles.add(title);
  const description=get('description');assert(!descriptions.has(description),p.path+' description');descriptions.add(description);
  assert.equal(get('og:title'),title);assert.equal(get('twitter:title'),title);assert.equal(get('og:description'),description);assert.equal(get('twitter:description'),description);
  const url=manifest.config.origin+p.path;assert(head.includes(`<link rel="canonical" href="${url}">`));assert.equal(get('og:url'),url);assert.equal(get('og:site_name'),'Auto Vos');assert.equal(get('og:locale'),'en_US');assert(['website','article'].includes(get('og:type')));assert.equal(get('twitter:card'),'summary_large_image');
  const image=get('og:image');assert.equal(get('twitter:image'),image);assert.equal(get('og:image:secure_url'),image);assert.equal(get('twitter:image:alt'),get('og:image:alt'));assert.equal(new URL(image).origin,manifest.config.origin);assert.equal(get('og:image:type'),'image/webp');assert(Number(get('og:image:width'))>=1200);assert(Number(get('og:image:height'))>=630);
  const imagePath=new URL(image).pathname;assert(assets.has(imagePath),mode+p.path+' image not packaged');assert(fs.statSync(dist+imagePath).size<2_000_000);
  assert.equal(get('robots').includes('noindex'),mode!=='production'||p.path==='/404.html');assert.equal((html.match(/<script type="application\/ld\+json">/g)||[]).length,1);
  const schema=JSON.parse(head.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);assert.equal(schema['@context'],'https://schema.org');const graph=schema['@graph'],ids=new Set(graph.map(n=>n['@id']));assert.equal(ids.size,graph.length);
  for(const [,id]of JSON.stringify(schema).matchAll(/"@id":"([^"]+)"/g))assert(ids.has(id),mode+p.path+' dangling '+id);
  const page=graph.find(n=>n['@id']===url+'#webpage');assert.equal(page.url,url);assert.equal(page.description,description);assert.equal(page.primaryImageOfPage['@id'],url+'#primary-image');assert.equal(graph.find(n=>n['@id']===url+'#primary-image').contentUrl,image);
  const article=graph.find(n=>n['@type']==='Article');assert.equal(get('og:type'),article?'article':'website');if(article)assert(html.includes('By <a href="/about/">Auto Vos</a>'));
  assert(!JSON.stringify(schema).includes('AggregateRating'));assert(!JSON.stringify(schema).includes('"@type":"Product"'));
  checks.push({mode,path:p.path,status:'passed',image:imagePath,types:graph.map(n=>n['@type'])});
 }
 const sitemap=fs.readFileSync(`${dist}/sitemap.xml`,'utf8');assert(!sitemap.includes('/404.html'));for(const p of manifest.pages)assert(sitemap.includes(`<loc>${manifest.config.origin+p.path}</loc>`));
}
fs.mkdirSync('design-artifacts/social-metadata-audit',{recursive:true});fs.writeFileSync('design-artifacts/social-metadata-audit/static-proof.json',JSON.stringify({checks,limits:'Static heads, parsed graph references and packaged assets; not a Google rich-results or social-platform rendering test.'},null,2)+'\n');
console.log(`${checks.length} complete metadata/graph/package checks passed across all three build modes.`);
