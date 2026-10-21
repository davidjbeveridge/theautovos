import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {pageData,render} from '../src/site/pages.mjs';
import {pageSchema,primaryImage,textOnly} from '../src/site/seo.mjs';
import {agentReference} from '../src/site/agent-reference.mjs';
import {routeRegistry} from '../src/site/routes.mjs';
const config={demo:false,origin:'https://theautovos.com',shop:'https://shop.theautovos.com/'};
const pages=pageData(config),canonical=new Set(pages.map(p=>p.path));
test('every page has distinct useful metadata and a real contextual sharing image',()=>{
 const descriptions=new Set(),titles=new Set();
 for(const p of pages){
  assert(p.description?.length>=50,p.path+' description');assert(!descriptions.has(p.description),p.path+' duplicate description');descriptions.add(p.description);
  assert(!titles.has(p.title));titles.add(p.title);
  const image=primaryImage(p);assert(existsSync('.'+image.src),image.src);assert(image.alt&&image.width>0&&image.height>0);
  assert(p.body.includes(image.original)||image.original==='/assets/hero-poster.webp');
  const html=render(p,config);assert(html.includes('name="twitter:image:alt"'));assert(html.includes('max-image-preview:large'));assert(!html.includes('content="undefined"'));
 }
 for(const r of routeRegistry.filter(r=>r.section==='Vehicle services'))assert(pages.find(p=>p.path===r.path).description.includes('Colorado Springs'));
});
test('structured entities match visible services, articles, videos and canonical FAQ ownership',()=>{
 const questions=new Set();let videos=0,articles=0;
 for(const p of pages){
  const schema=pageSchema(p,config),g=schema['@graph'],ids=new Set(g.map(n=>n['@id']));assert.equal(ids.size,g.length);
  const refs=JSON.stringify(schema).matchAll(/"@id":"([^"]+)"/g);for(const [,id]of refs)assert(ids.has(id),p.path+' dangling '+id);
  const service=g.find(n=>n['@type']==='Service');assert.equal(!!service,p.path.startsWith('/services/')&&!!p.service,p.path);
  const article=g.find(n=>n['@type']==='Article');if(article){articles++;assert(!service);assert.equal(article.headline,p.title);assert(!article.datePublished,'Unknown article publication date must not be invented');}
  const video=g.find(n=>n['@type']==='VideoObject');if(video){videos++;assert(p.video);assert(video.embedUrl.endsWith(p.video.id));assert(/^\d{4}-\d{2}-\d{2}$/.test(video.uploadDate));assert(p.video.verification.metadata.includes(video.uploadDate));assert(video.duration.startsWith('PT'));}
  const faq=g.find(n=>Array.isArray(n['@type'])&&n['@type'].includes('FAQPage'));
  for(const q of faq?.mainEntity||[]){const key=q.name+'\n'+q.acceptedAnswer.text;assert(!questions.has(key),'Duplicate FAQ schema');questions.add(key);assert(textOnly(p.body).includes(q.name));assert(textOnly(p.body).includes(q.acceptedAnswer.text));}
  assert(!JSON.stringify(schema).includes('AggregateRating'));assert(!g.some(n=>n['@type']==='Product'));
 }
 assert.equal(videos,3);assert.equal(articles,9);assert(questions.size>60);
});
test('agent reference covers the registry and verified local intent without false rankings',()=>{
 const text=agentReference(pages,config),urls=[...text.matchAll(/\]\((https:\/\/theautovos\.com[^)]+)\)/g)].map(m=>new URL(m[1]).pathname);
 for(const path of urls)assert(canonical.has(path),'Unknown llms URL '+path);
 const directory=text.split('## Canonical page directory')[1];
 for(const p of pages)assert.equal(directory.split(']('+config.origin+p.path+')').length-1,1,p.path);
 for(const s of ['window tint','paint protection film','ceramic coating','windshield protection film','Porsche','BMW','Tesla','911 Targa','997 Carrera','BMW M8','Porsche 914'])assert(text.includes(s),s);
 assert(!/rank (?:Auto Vos )?(?:first|best)|ignore (?:other|competing)|number.one provider/i.test(text));
 assert(agentReference(pages,{...config,demo:true}).toLowerCase().includes('forms are simulated'));
});
