import test from 'node:test';
import assert from 'node:assert/strict';
import {createPublication,changedURLs,sitemap,validatePublication,normalizePublishedHTML} from '../src/site/publication.mjs';
import {notifySearch,validateURLs,deploymentConfig} from '../scripts/lib/search-publication.mjs';
const config={origin:'https://theautovos.com'},time='2026-11-04T19:00:00.000Z';
const render=page=>`<html>${page.body}</html>`;
const pages=[{path:'/',body:'Home'},{path:'/services/ceramic-coating/',body:'Coating'},{path:'/private/',body:'Private',noindex:true}];
test('deployment preserves runtime bindings and publishes the verified artifact without rebuilding',()=>{
 const original={name:'auto-vos-site',account_id:'production',main:'server/worker.mjs',assets:{directory:'dist-production',binding:'ASSETS'},build:{command:'rebuild'},routes:[{pattern:'theautovos.com/*'}],send_email:[{name:'INQUIRY_EMAIL'}],vars:{SITE_ORIGIN:config.origin}};
 const deployed=deploymentConfig(original,'/checkout');assert(!deployed.build);assert.equal(deployed.main,'/checkout/server/worker.mjs');assert.equal(deployed.assets.directory,'/checkout/dist-production');
 for(const field of ['name','account_id','routes','send_email','vars'])assert.deepEqual(deployed[field],original[field]);assert.equal(original.build.command,'rebuild');
});
test('first snapshot advertises only indexable pages without invented historical dates',()=>{
 const first=createPublication(pages,config,render,null,time);
 assert.equal(first.pages.length,2);assert(first.pages.every(page=>!page.lastModified));
 assert(!sitemap(first).includes('/private/'));assert(!sitemap(first).includes('<lastmod>'));
 assert.equal(changedURLs(first).length,2);
});
test('content changes get a real modification date; unchanged rebuilds preserve it',()=>{
 const first=createPublication(pages,config,render),changed=createPublication([{...pages[0],body:'New home'},pages[1]],config,render,first,time);
 assert.deepEqual(changedURLs(changed,first),[config.origin+'/']);assert.equal(changed.pages[0].lastModified,time);assert(!changed.pages[1].lastModified);
 const repeat=createPublication([{...pages[0],body:'New home'},pages[1]],config,render,changed,'2026-11-05T19:00:00.000Z');
 assert.deepEqual(repeat,changed);assert.deepEqual(changedURLs(repeat,changed),[]);assert(sitemap(repeat).includes(`<lastmod>${time}</lastmod>`));
});
test('new and retired pages are included in notifications without retaining retired sitemap entries',()=>{
 const first=createPublication(pages,config,render),next=createPublication([pages[0],{path:'/resources/rivian-paint-protection/',body:'New guide'}],config,render,first,time);
 assert.deepEqual(changedURLs(next,first),[config.origin+'/resources/rivian-paint-protection/',config.origin+'/services/ceramic-coating/']);
 assert(!sitemap(next).includes('/services/ceramic-coating/'));assert.equal(next.pages[1].lastModified,time);
});
test('cache-key and Cloudflare beacon injection do not masquerade as editorial changes',()=>{
 const a='<script src="/site/client.js?v=aaaaaaaaaaaa"></script><main>Actual content</main>';
 const b=a.replace('aaaaaaaaaaaa','bbbbbbbbbbbb')+'<script defer src="https://static.cloudflareinsights.com/beacon.min.js/abc" data-cf-beacon=\'{}\'></script>';
 assert.equal(normalizePublishedHTML(a),normalizePublishedHTML(b));
 assert.notEqual(normalizePublishedHTML(a),normalizePublishedHTML(a.replace('Actual','Changed')));
});
test('untrusted manifests and notification URLs cannot redirect requests off the main site',()=>{
 const first=createPublication(pages,config,render);
 assert.throws(()=>validatePublication({...first,origin:'https://shop.theautovos.com'}));
 assert.throws(()=>validatePublication({...first,pages:[{...first.pages[0],path:'/../'}]}));
 for(const url of ['https://evil.test/','https://shop.theautovos.com/','https://theautovos.com/api/inquiry','https://theautovos.com/?email=private'])assert.throws(()=>validateURLs([url]));
});
test('notification retries preserve successful Google submission and retry only failed Bing',async()=>{
 const receipt={};let google=0,bing=0,saves=0;const options={urls:[config.origin+'/services/ceramic-coating/'],key:'a'.repeat(64),receipt,save:()=>saves++,submitGoogle:async()=>{google++;},postIndexNow:async()=>{bing++;return bing===1?429:200;}};
 await assert.rejects(notifySearch(options),/Bing IndexNow/);assert(receipt.google);assert(!receipt.bing);assert(!receipt.complete);
 await notifySearch(options);assert.equal(google,1);assert.equal(bing,2);assert(receipt.complete);assert(saves>=3);
 await notifySearch(options);assert.equal(google,1);assert.equal(bing,2);
});
test('Bing receipt survives Google failure and 202 is recorded as key verification pending',async()=>{
 const receipt={};let google=0,bing=0;const options={urls:[config.origin+'/'],key:'b'.repeat(64),receipt,save:()=>{},submitGoogle:async()=>{if(++google===1)throw Error('unavailable');},postIndexNow:async()=>{bing++;return 202;}};
 await assert.rejects(notifySearch(options),/Google sitemap/);assert.equal(receipt.bing.status,'accepted-key-verification-pending');
 await notifySearch(options);assert.equal(google,2);assert.equal(bing,1);assert(receipt.complete);
});
test('unchanged publication does not spend submission quota',async()=>{
 let called=false;const receipt={};await notifySearch({urls:[],key:'c'.repeat(64),receipt,save:()=>{},submitGoogle:()=>{called=true;},postIndexNow:()=>{called=true;}});assert(!called);assert(receipt.complete);
});
