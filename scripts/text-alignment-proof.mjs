import fs from 'node:fs';
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({channel:'chrome',headless:true});
const routes=JSON.parse(fs.readFileSync('design-artifacts/demo-manifest.json')).pages.map(p=>p.path);
routes.push(...fs.readdirSync('templates').filter(p=>p.endsWith('.html')).map(p=>'http://127.0.0.1:8787/templates/'+p),'http://127.0.0.1:8787/design-system/');
const results=[];
try{
 const p=await browser.newPage();
 await p.route('https://**/*',r=>r.abort());
 for(const width of [390,768,1024,1440]){
  await p.setViewportSize({width,height:900});
  for(const route of routes){
   await p.goto(route.startsWith('http')?route:'http://127.0.0.1:8790'+route,{waitUntil:'domcontentloaded'});
   const result=await p.evaluate(()=>{
    const errors=[];let rows=0;
    const selectors=['.av-service-grid','.av-work-grid','.av-benefit-grid','.av-steps--horizontal','.site-education-steps','.site-story-grid','.site-comparison','.av-xpel-products'];
    for(const selector of selectors) for(const grid of document.querySelectorAll(selector)){
     const groups=new Map();
     for(const child of grid.children){
      const h=child.querySelector('h2,h3,h4'),body=child.querySelector(':scope>p,:scope>ul');
      if(!h||!body)continue;
      const top=Math.round(child.getBoundingClientRect().top);
      const row=groups.get(top)||[];row.push({h:h.getBoundingClientRect(),p:body.getBoundingClientRect()});groups.set(top,row);
     }
     for(const row of groups.values()){
      if(row.length<2)continue;rows++;
      for(const item of row){
       if(Math.abs(item.h.top-row[0].h.top)>1||Math.abs(item.p.top-row[0].p.top)>1)errors.push(selector+' staggered heading/body');
       if(Math.abs(item.h.left-item.p.left)>1)errors.push(selector+' unequal text rails');
      }
     }
    }
    if(document.documentElement.scrollWidth>innerWidth+1)errors.push('horizontal overflow');
    return {rows,errors};
   });
   assert.deepEqual(result.errors,[],`${route} @ ${width}`);results.push({route,width,rows:result.rows});
  }
 }
 await p.goto('http://127.0.0.1:8790/');
 await p.locator('.av-steps--horizontal').screenshot({path:'design-artifacts/site/aligned-process.png'});
 fs.writeFileSync('design-artifacts/site/text-alignment-proof.json',JSON.stringify(results,null,2));
 console.log(`${results.length} page/viewport checks passed; ${results.reduce((n,r)=>n+r.rows,0)} aligned rows measured.`);
}finally{await browser.close();}
