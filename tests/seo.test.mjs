import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {pageData,render,notFound} from '../src/site/pages.mjs';
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
  assert(p.body.includes(image.original)||image.original==='/assets/hero-poster.webp'||image.original===p.sharingImage?.src);
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
  const article=g.find(n=>n['@type']==='Article');if(article){articles++;assert(!service);assert.equal(article.headline,textOnly(p.body.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)[1]));assert(!article.datePublished,'Unknown article publication date must not be invented');}
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

const meta=(html,key)=>[...html.matchAll(/<meta\b[^>]*>/g)].filter(m=>m[0].includes(`name="${key}"`)||m[0].includes(`property="${key}"`)).map(m=>textOnly(m[0].match(/content="([^"]*)"/)[1]));
test('complete social metadata stays unique, consistent and usable on every page and error page',()=>{
 for(const demo of [false,true])for(const p of [...pages,notFound()]){
  const env={...config,demo,origin:demo?'https://7c4e9a.demos.beveridge.io':config.origin};
  const html=render(p,env),image=primaryImage(p),url=env.origin+p.path;
  for(const key of ['description','robots','og:title','og:description','og:type','og:site_name','og:locale','og:url','og:image','og:image:secure_url','og:image:type','og:image:width','og:image:height','og:image:alt','twitter:card','twitter:title','twitter:description','twitter:image','twitter:image:alt'])assert.equal(meta(html,key).length,1,p.path+' '+key);
  assert.deepEqual(meta(html,'og:url'),[url]);assert.deepEqual(meta(html,'og:image:secure_url'),meta(html,'og:image'));
  assert.deepEqual(meta(html,'og:title'),meta(html,'twitter:title'));assert.deepEqual(meta(html,'description'),meta(html,'og:description'));assert.deepEqual(meta(html,'description'),meta(html,'twitter:description'));
  assert.deepEqual(meta(html,'og:image'),meta(html,'twitter:image'));assert.deepEqual(meta(html,'og:image:alt'),meta(html,'twitter:image:alt'));
  assert.equal(meta(html,'og:image:type')[0],'image/webp');assert(image.width>=1200&&image.height>=630,p.path+' sharing image too small');
  assert.equal(meta(html,'og:image')[0],env.origin+image.src);assert.equal(meta(html,'robots')[0].includes('noindex'),demo||!!p.noindex);
  assert(!/name="keywords"|property="fb:app_id"|name="twitter:site"/.test(html),'Do not invent accounts or keyword tags');
 }
});
test('reviewed contextual images replace tiny or wrong-brand defaults',()=>{
 const expected={
  '/about/':'/assets/work/oct15/corvette-outside-auto-vos.jpg',
  '/services/window-tint/porsche/':'/assets/targa-guide/step-03-graded.jpg',
  '/services/window-tint/porsche/911-targa/':'/assets/targa-guide/step-03-graded.jpg',
  '/services/paint-protection-film/bmw/':'/assets/reviews/jonathan-1.jpg',
  '/work/ineos-grenadier-tint-ppf/':'/assets/video-previews/ineos-grenadier-tint-ppf.jpg'
 };
 assert.deepEqual(Object.fromEntries(pages.filter(p=>p.sharingImage).map(p=>[p.path,p.sharingImage.src])),expected);
});
test('linked page graphs and visible article credits describe the actual content',()=>{
 for(const p of [...pages,notFound()]){
  const graph=pageSchema(p,config)['@graph'],page=graph.find(n=>n['@id']===config.origin+p.path+'#webpage'),article=graph.find(n=>n['@type']==='Article'),list=graph.find(n=>n['@type']==='ItemList');
  assert.equal(page.publisher['@id'],config.origin+'/#business');
  if(p.path!=='/'&&!p.noindex)assert.equal(page.breadcrumb['@id'],config.origin+p.path+'#breadcrumbs');else assert(!page.breadcrumb);
  if(article){assert.equal(article.author['@id'],config.origin+'/#business');assert.match(render(p,config),/By <a href="\/about\/">Auto Vos<\/a>/);assert(!article.dateModified);}
  if(list)assert.equal(page.mainEntity['@id'],list['@id']);
  if(['/contact/','/about/'].includes(p.path))assert.equal(page.mainEntity['@id'],config.origin+'/#business');
  const business=graph.find(n=>n['@type']==='AutomotiveBusiness');assert.equal(business.contactPoint.email,'theautovos@gmail.com');assert.equal(business.contactPoint.url,config.origin+'/contact/');
 }
});
