import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

export const productionOrigin='https://theautovos.com';
export const digest=value=>createHash('sha256').update(value).digest('hex');
export const pageFile=route=>route==='/'?'index.html':route.slice(1)+'index.html';
const validPath=path=>path==='/'||/^\/(?:[a-z0-9-]+\/)+$/.test(path);
const validDate=value=>typeof value==='string'&&new Date(value).toISOString()===value;
export function validatePublication(value,origin=productionOrigin){
 assert.equal(value.version,1,'Unsupported publication manifest');
 assert.equal(value.origin,origin,'Publication origin differs');
 assert(Array.isArray(value.pages)&&value.pages.length>0&&value.pages.length<=10000);
 const paths=new Set();
 for(const page of value.pages){
  assert(validPath(page.path)&&!paths.has(page.path),'Invalid or duplicate publication path');paths.add(page.path);
  assert.match(page.hash,/^[a-f0-9]{64}$/);
  if(page.lastModified)assert(validDate(page.lastModified),'Invalid modification date');
 }
 return value;
}
// Analytics injection and asset-version cache keys are not editorial changes.
export function normalizePublishedHTML(html){
 return html.replace(/<script\b[^>]*\bsrc="https:\/\/static\.cloudflareinsights\.com\/[^"\s]+"[^>]*>[\s\S]*?<\/script>/g,'').replace(/\?v=[a-f0-9]{12}(?=")/g,'');
}
export function createPublication(pages,config,render,previous=null,publishedAt=null){
 if(previous)validatePublication(previous,config.origin);
 if(publishedAt)assert(validDate(publishedAt),'Publication time must be an ISO timestamp');
 const prior=new Map(previous?.pages.map(page=>[page.path,page])||[]);
 const result={version:1,origin:config.origin,pages:pages.filter(page=>!page.noindex).map(page=>{
  const hash=digest(normalizePublishedHTML(render(page,config))),old=prior.get(page.path);
  // A first snapshot has no reliable historical modification dates. Do not invent them.
  const lastModified=old?.hash===hash?old.lastModified:previous&&publishedAt?publishedAt:null;
  return {path:page.path,hash,...(lastModified?{lastModified}:{})};
 })};
 return validatePublication(result,config.origin);
}
export function changedURLs(current,previous=null,notificationBaseline=true){
 validatePublication(current);
 if(previous)validatePublication(previous);
 const old=new Map(previous?.pages.map(page=>[page.path,page.hash])||[]),now=new Map(current.pages.map(page=>[page.path,page.hash]));
 return [...new Set([...current.pages.filter(page=>!notificationBaseline||old.get(page.path)!==page.hash).map(page=>page.path),...(previous?.pages||[]).filter(page=>!now.has(page.path)).map(page=>page.path)])].map(path=>productionOrigin+path);
}
export function sitemap(publication){
 return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${publication.pages.map(page=>`<url><loc>${publication.origin+page.path}</loc>${page.lastModified?`<lastmod>${page.lastModified}</lastmod>`:''}</url>`).join('')}</urlset>\n`;
}
