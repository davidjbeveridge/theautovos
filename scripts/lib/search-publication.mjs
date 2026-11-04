import assert from 'node:assert/strict';
import path from 'node:path';
import {productionOrigin} from '../../src/site/publication.mjs';

export function deploymentConfig(config,root){
 const result=structuredClone(config);
 delete result.build;
 result.main=path.resolve(root,config.main);
 result.assets.directory=path.resolve(root,config.assets.directory);
 return result;
}

export function validateURLs(urls){
 assert(Array.isArray(urls)&&urls.length<=10000);
 for(const value of urls){
  const url=new URL(value);
  assert.equal(url.origin,productionOrigin,'Only the production main site may be submitted');
  assert(!url.search&&!url.hash&&!url.username&&!url.password);
  assert(url.pathname==='/'||/^\/(?:[a-z0-9-]+\/)+$/.test(url.pathname),'Only canonical page paths may be submitted');
  assert(!url.pathname.startsWith('/api/'));
 }
 assert.equal(new Set(urls).size,urls.length);
}
// Each provider gets its own durable receipt, so a failed provider can be retried
// without repeating successful submissions. Acceptance is not proof of indexing.
export async function notifySearch({urls,key,receipt,save,submitGoogle,postIndexNow}){
 validateURLs(urls);assert.match(key,/^[a-f0-9]{64}$/);
 if(!urls.length){receipt.complete=true;receipt.reason='No indexable page changes';save();return receipt;}
 const failures=[];
 if(!receipt.google){
  try{await submitGoogle();receipt.google={status:'sitemap-submitted',at:new Date().toISOString()};save();}
  catch{failures.push('Google sitemap submission failed');}
 }
 if(!receipt.bing){
  try{
   const status=await postIndexNow({host:'theautovos.com',key,keyLocation:productionOrigin+'/'+key+'.txt',urlList:urls});
   assert([200,202].includes(status));
   receipt.bing={status:status===202?'accepted-key-verification-pending':'accepted',httpStatus:status,urls:urls.length,at:new Date().toISOString()};save();
  }catch{failures.push('Bing IndexNow submission failed');}
 }
 if(failures.length)throw Error(failures.join('; ')+'. Retry with npm run notify:production.');
 receipt.notificationBaseline=true;receipt.complete=true;save();return receipt;
}
