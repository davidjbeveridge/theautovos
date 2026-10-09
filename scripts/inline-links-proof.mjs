import assert from 'node:assert/strict';
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const b=await chromium.launch({channel:'chrome',headless:true});const checks=[];
try{
const p=await b.newPage();
const local=f=>pathToFileURL(process.cwd()+'/'+f).href;
const cases=[['faq','http://127.0.0.1:8790/services/ceramic-coating/','.site-service-questions details p a'],['catalog-light',local('design-system/index.html'),'.ds-inline-light a'],['catalog-dark',local('design-system/index.html'),'.ds-inline-dark a'],['original',local('index.html'),'.inline-link']];
for(const width of [390,891,1440])for(const [name,url,selector] of cases){
await p.setViewportSize({width,height:827});await p.goto(url);await p.locator('details').evaluateAll(es=>es.forEach(e=>e.open=true));const a=p.locator(selector).first();await a.scrollIntoViewIfNeeded();const s=await a.evaluate(e=>{const c=getComputedStyle(e);return {color:c.color,weight:c.fontWeight,line:c.textDecorationLine,thickness:c.textDecorationThickness};});assert.equal(s.weight,'700',name);assert.ok(s.line.includes('underline'),name);assert.ok(['rgb(21, 90, 182)','rgb(140, 196, 255)'].includes(s.color),name+JSON.stringify(s));await a.hover();assert.ok(parseFloat(await a.evaluate(e=>getComputedStyle(e).textDecorationThickness))>parseFloat(s.thickness));await a.focus();assert.equal(await a.evaluate(e=>getComputedStyle(e).outlineStyle),'solid');
checks.push({name,width,...s,passed:true});if(width===891)await p.screenshot({path:`design-artifacts/site/inline-${name}.png`});
}
await p.goto(cases[0][1]);assert.equal(await p.locator('.av-header .av-button').first().evaluate(e=>getComputedStyle(e).textDecorationLine),'none');
fs.writeFileSync('design-artifacts/site/inline-links-proof.json',JSON.stringify({browser:'Chrome',checks},null,2));console.log(checks.length+' inline link style/state checks passed');
}finally{await b.close()}
