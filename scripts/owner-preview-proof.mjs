import {pathToFileURL} from 'node:url';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:'playwright');
import assert from 'node:assert/strict';
const base=process.env.PREVIEW_URL||'http://127.0.0.1:8787/dist';
const b=await chromium.launch({channel:'chrome',headless:true});
try {const p=await b.newPage({reducedMotion:'reduce'});const errors=[];p.on('pageerror',e=>errors.push(e.message));
for(const width of [1440,390]){
 await p.setViewportSize({width,height:900});await p.goto(base+'/');
 assert.ok(await p.locator('a[href="design-system/index.html"]').count());
 assert.equal(await p.locator('a[href^="https://www.theautovos.com/"]').count(),0);
 assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await p.locator('.primary-invitation').click();await p.waitForURL('**/templates/quote.html');
 assert.ok(await p.getByText('This preview sends nothing',{exact:false}).isVisible());
 await p.goto(base+'/design-system/');assert.equal(await p.locator('body').innerText().then(t=>/jacques|xenia|strict-simple|scripts\/|contracts\/|runtime framework/i.test(t)),false);
 await p.getByRole('link',{name:'View the site concept'}).click();await p.waitForURL('**/index.html');
}
assert.deepEqual(errors,[]);console.log('Owner preview links, copy and layout passed at desktop/mobile.');
}finally{await b.close();}
