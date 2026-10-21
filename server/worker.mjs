import {handleInquiry,productionDependencies} from './inquiry.mjs';
export default {async fetch(request,env){
 const url=new URL(request.url);
 // Preserve legacy www links and HTTP URLs without losing paths or campaign parameters.
 if(env.SITE_ORIGIN==='https://theautovos.com'&&['theautovos.com','www.theautovos.com'].includes(url.hostname)&&url.origin!==env.SITE_ORIGIN){
  url.protocol='https:';url.hostname='theautovos.com';url.port='';
  return Response.redirect(url.toString(),308);
 }
 if(url.pathname==='/api/inquiry')return handleInquiry(request,productionDependencies(env));
 if(url.pathname.startsWith('/api/'))return new Response('Not found',{status:404});
 const response=await env.ASSETS.fetch(request);
 // A temporary workers.dev staging address must not compete with the production domain.
 if(env.SITE_ORIGIN==='https://theautovos.com'&&url.hostname!=='theautovos.com'){
  const staged=new Response(response.body,response);staged.headers.set('X-Robots-Tag','noindex, nofollow');return staged;
 }
 return response;
}};
