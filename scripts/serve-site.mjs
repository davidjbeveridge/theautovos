import http from 'node:http';import fs from 'node:fs';import path from 'node:path';
import {handleInquiry} from '../server/inquiry.mjs';
const prod=process.argv.includes('--production'),port=Number(process.env.PORT||8790),root=path.resolve(prod?'dist-production':'dist-demo');
const loadManifest=()=>JSON.parse(fs.readFileSync(`design-artifacts/${prod?'production':'demo'}-manifest.json`));
const mimes={'.mp4':'video/mp4','.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.txt':'text/plain; charset=utf-8','.xml':'application/xml'};
const server=http.createServer(async(req,res)=>{const origin=`http://127.0.0.1:${port}`;let url;try{url=new URL(req.url,origin);}catch{res.writeHead(400);res.end();return;}
 if(url.pathname==='/api/inquiry'){
  const request=new Request(origin+req.url,{method:req.method,headers:req.headers,...(['GET','HEAD'].includes(req.method)?{}:{body:req,duplex:'half'})});
  const result=await handleInquiry(request,{origin,available:!prod,demo:true,limit:async()=>true,verifySpam:async token=>token==='local-demo',deliver:async()=>({accepted:true})});
  res.writeHead(result.status,Object.fromEntries(result.headers));res.end(await result.text());return;
 }
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
 const redirect=loadManifest().redirects.find(r=>r.from===url.pathname);if(redirect){res.writeHead(301,{location:(()=>{const target=new URL(redirect.to,origin);for(const [k,v] of url.searchParams)target.searchParams.append(k,v);return target.origin===origin?target.pathname+target.search+target.hash:target.href;})()});res.end();return;}
 let rel;try{rel=decodeURIComponent(url.pathname).replace(/^\/+/, '');}catch{res.writeHead(400);res.end();return;}
 let target=path.resolve(root,rel);if(!target.startsWith(root+path.sep)&&target!==root){res.writeHead(403);res.end();return;}
 if(fs.existsSync(target)&&fs.statSync(target).isDirectory()){if(!url.pathname.endsWith('/')){res.writeHead(301,{location:url.pathname+'/'+url.search});res.end();return;}target=path.join(target,'index.html');}
 else if(!path.extname(target)&&fs.existsSync(target+'.html'))target+='.html';
 let status=200;if(!fs.existsSync(target)||!fs.statSync(target).isFile()){target=path.join(root,'404.html');status=404;}
 res.writeHead(status,{'content-type':mimes[path.extname(target)]||'application/octet-stream','cache-control':'no-store','x-robots-tag':'noindex, nofollow'});if(req.method==='HEAD')res.end();else fs.createReadStream(target).pipe(res);
});server.listen(port,'127.0.0.1',()=>console.log(`Local ${prod?'production candidate (delivery disabled)':'client demo'}: http://127.0.0.1:${port}`));
