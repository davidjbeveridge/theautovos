// Production release entry point. No notifications run during build or preview.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {productionOrigin,validatePublication,changedURLs,digest,pageFile,normalizePublishedHTML} from '../src/site/publication.mjs';
import {notifySearch,deploymentConfig} from './lib/search-publication.mjs';

process.chdir(path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'));
const args=new Set(process.argv.slice(2));
assert([...args].every(arg=>['--notify-only','--resume'].includes(arg)),'Unsupported publication option');
assert(!(args.has('--notify-only')&&args.has('--resume')));
const stateDir=path.resolve(process.env.AUTOVOS_PUBLISH_STATE_DIR||path.join(os.homedir(),'.local/state/autovos-publishing'));
fs.mkdirSync(stateDir,{recursive:true,mode:0o700});
const directory=fs.lstatSync(stateDir);
assert(directory.isDirectory()&&!directory.isSymbolicLink()&&!(directory.mode&0o077),'Publication state must be a private directory');
assert.equal(fs.realpathSync(stateDir),stateDir,'Publication state path must not contain symlinks');
assert(directory.uid===process.getuid?.()||process.getuid===undefined,'Publication state owner differs');
const lock=path.join(stateDir,'lock');fs.mkdirSync(lock,{mode:0o700});
fs.writeFileSync(path.join(lock,'owner.json'),JSON.stringify({pid:process.pid,started:new Date().toISOString()}),{mode:0o600});
const stateFile=path.join(stateDir,'publication.json'),keyFile=path.join(stateDir,'indexnow-key');
const privateRead=file=>{
 const stat=fs.lstatSync(file);assert(stat.isFile()&&!stat.isSymbolicLink()&&!(stat.mode&0o077),'Private publication file is unsafe');
 assert(stat.uid===process.getuid?.()||process.getuid===undefined,'Private publication file owner differs');
 return fs.readFileSync(file,'utf8');
};
const privateWrite=(destination,value)=>{
 const temporary=path.join(stateDir,'write-'+randomBytes(8).toString('hex'));
 fs.writeFileSync(temporary,JSON.stringify(value,null,2)+'\n',{mode:0o600,flag:'wx'});fs.renameSync(temporary,destination);
};
const save=value=>privateWrite(stateFile,value);
const run=(command,commandArgs,options={})=>execFileSync(command,commandArgs,{encoding:'utf8',timeout:120000,...options});
const wrangler=commandArgs=>{
 const options={stdio:'inherit',env:{...process.env,WRANGLER_LOG:'warn',WRANGLER_SEND_METRICS:'false'}};
 return process.env.WRANGLER_BIN?run(process.execPath,[process.env.WRANGLER_BIN,...commandArgs],options):run('npx',['--yes','wrangler@4.152.0',...commandArgs],options);
};
async function get(resource){
 return fetch(productionOrigin+resource,{redirect:'manual',signal:AbortSignal.timeout(30000),headers:{'Cache-Control':'no-cache','User-Agent':'AutoVosPublicationVerification/1.0'}});
}
async function verify(job,key){
 for(let i=0;i<job.files.length;i+=5)await Promise.all(job.files.slice(i,i+5).map(async file=>{
  const response=await get(file.path);assert.equal(response.status,200,'Published artifact unavailable: '+file.path);
  assert(!/noindex/i.test(response.headers.get('x-robots-tag')||''),'Production artifact has noindex');
  const body=await response.text();assert.equal(digest(file.html?normalizePublishedHTML(body):body),file.hash,'Published artifact differs: '+file.path);
 }));
 const proof=await get('/'+key+'.txt');assert.equal(proof.status,200,'IndexNow ownership proof unavailable');
 assert.equal((await proof.text()).trim(),key,'IndexNow ownership proof differs');
 for(const url of job.removed||[]){const response=await get(new URL(url).pathname);assert([301,308,404,410].includes(response.status),'Retired page still returns indexable content');}
 job.verifiedAt=new Date().toISOString();save(job);
}
try{
 if(!fs.existsSync(keyFile)){
  assert(!fs.existsSync(stateFile),'Existing IndexNow key is missing; restore it instead of silently replacing it');
  fs.writeFileSync(keyFile,randomBytes(32).toString('hex')+'\n',{mode:0o600,flag:'wx'});
 }
 const key=privateRead(keyFile).trim();assert.match(key,/^[a-f0-9]{64}$/);
 let job=fs.existsSync(stateFile)?JSON.parse(privateRead(stateFile)):null;
 if(!args.has('--notify-only')){
  run('git',['fetch','origin','main'],{stdio:'inherit'});
  const revision=run('git',['rev-parse','HEAD']).trim();
  assert.equal(run('git',['rev-parse','origin/main']).trim(),revision,'Publish the fetched, merged main revision');
  assert.equal(run('git',['diff','HEAD','--','src','server','scripts','assets','design/presentation.yaml','design/page-inventory.json','wrangler.jsonc']).trim(),'','Commit public source changes before publication');
  assert.equal(run('git',['ls-files','--others','--exclude-standard','--','src','server']).trim(),'','Untracked application code must not enter a production release');
  const site=JSON.parse(run('gog',['searchconsole','sites','get','sc-domain:theautovos.com','--readonly','--json','--no-input']));
  assert(/siteOwner|siteFullUser/.test(JSON.stringify(site)),'Search Console write access is required before publishing');
  if(args.has('--resume')){
   assert(job&&!job.complete&&job.revision===revision,'No unfinished publication for this revision');
   for(const file of job.files){const local=fs.readFileSync('dist-production/'+file.file,'utf8');assert.equal(digest(file.html?normalizePublishedHTML(local):local),file.hash,'Prepared build changed; cannot resume');}
  }else{
   assert(!job||job.complete,'Unfinished publication: use --resume after deploy failure, or npm run notify:production after a successful deploy');
   const response=await get('/site/publication.json');let previous=null;
   if(response.status===200)previous=validatePublication(await response.json());else assert.equal(response.status,404,'Cannot read the previous publication');
   const previousFile=path.join(stateDir,'previous.json');
   if(previous)privateWrite(previousFile,previous);
   for(const script of ['build.mjs','verify.mjs'])run(process.execPath,['scripts/'+script],{stdio:'inherit'});
   run(process.execPath,['--test','--test-reporter=dot',...fs.readdirSync('tests').filter(file=>file.endsWith('.test.mjs')).sort().map(file=>'tests/'+file)],{stdio:'inherit'});
   run('jacques',['check','run','--tier','fast','--ci'],{stdio:'inherit'});
   const buildEnv={...process.env,INDEXNOW_KEY_FILE:keyFile,PREVIOUS_PUBLICATION_FILE:previous?previousFile:'',PUBLICATION_TIME:new Date().toISOString()};
   run(process.execPath,['scripts/build-site.mjs'],{stdio:'inherit',env:buildEnv});
   run(process.execPath,['scripts/build-production.mjs'],{stdio:'inherit',env:buildEnv});
   for(const script of ['build-hosted-demo.mjs','verify-site.mjs','verify-metadata.mjs'])run(process.execPath,['scripts/'+script],{stdio:'inherit',env:buildEnv});
   run(process.execPath,['scripts/verify-shop-navigation.mjs','--local-only'],{stdio:'inherit'});
   const publication=validatePublication(JSON.parse(fs.readFileSync('dist-production/site/publication.json','utf8')));
   const files=[...publication.pages.map(page=>({path:page.path,file:pageFile(page.path),html:true})),...['sitemap.xml','llms.txt','site/publication.json','site/style.css','site/tokens.css','site/client.js'].map(file=>({path:'/'+file,file,html:false}))].map(file=>({...file,hash:digest(file.html?normalizePublishedHTML(fs.readFileSync('dist-production/'+file.file,'utf8')):fs.readFileSync('dist-production/'+file.file,'utf8'))}));
   const notificationBaseline=job?.notificationBaseline||Boolean(job?.google&&job?.bing);
   const urls=changedURLs(publication,previous,notificationBaseline),active=new Set(publication.pages.map(page=>productionOrigin+page.path));
   job={version:1,revision,preparedAt:new Date().toISOString(),notificationBaseline,urls,removed:urls.filter(url=>!active.has(url)),files,complete:false};save(job);
  }
  // Wrangler has no skip-build switch. Preserve all runtime bindings while
  // removing only the custom build hook from a private, path-resolved config.
  const deployFile=path.join(stateDir,'deploy.json');
  privateWrite(deployFile,deploymentConfig(JSON.parse(fs.readFileSync('wrangler.jsonc','utf8').replace(/^\s*\/\/.*$/gm,'')),process.cwd()));
  wrangler(['deploy','--config',deployFile]);
  job.deployedAt=new Date().toISOString();save(job);
 }
 assert(job,'No prepared publication to notify');
 await verify(job,key);
 await notifySearch({urls:job.urls,key,receipt:job,save:()=>save(job),submitGoogle:()=>run('gog',['searchconsole','sitemaps','submit','sc-domain:theautovos.com',productionOrigin+'/sitemap.xml','--json','--no-input']),postIndexNow:async body=>{
  const response=await fetch('https://www.bing.com/indexnow',{method:'POST',headers:{'Content-Type':'application/json; charset=utf-8'},body:JSON.stringify(body),redirect:'error',signal:AbortSignal.timeout(30000)});return response.status;
 }});
 console.log(JSON.stringify({revision:job.revision,verifiedFiles:job.files.length,changedURLs:job.urls.length,google:job.google?.status||'unchanged',bing:job.bing?.status||'unchanged',complete:job.complete,limits:'Notification receipt only; indexing and ranking remain search-engine decisions.'},null,2));
}catch(error){console.error(error.message);process.exitCode=1;}
finally{fs.rmSync(lock,{recursive:true,force:true});}
