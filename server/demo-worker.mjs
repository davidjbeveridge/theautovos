import {handleInquiry} from './inquiry.mjs';

// Isolated preview transport. No email binding, provider secret, storage or PII logs.
export default {async fetch(request,env){
 const path=new URL(request.url).pathname;
 let response;
 if(path==='/api/inquiry')response=await handleInquiry(request,{
  origin:env.SITE_ORIGIN,demo:true,
  limit:async request=>{const ip=request.headers.get('cf-connecting-ip');return !!ip&&(await env.INQUIRY_RATE_LIMITER.limit({key:ip})).success;},
  verifySpam:async token=>token==='local-demo',
  deliver:async()=>({accepted:true})
 });
 else if(path.startsWith('/api/'))response=new Response('Not found',{status:404});
 else response=await env.ASSETS.fetch(request);
 const result=new Response(response.body,response);
 result.headers.set('X-Robots-Tag','noindex, nofollow, noarchive, nosnippet');
 result.headers.set('Cache-Control','no-store');
 return result;
}};
