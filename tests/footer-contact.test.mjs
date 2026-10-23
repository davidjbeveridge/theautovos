import test from 'node:test';
import assert from 'node:assert/strict';
import {pageData,render,notFound} from '../src/site/pages.mjs';

for(const mode of ['local','preview','production'])test(`${mode}: one inquiry form per page with the correct delivery and map composition`,()=>{
 const live=mode!=='local';
 const config={demo:mode!=='production',hostedDemo:mode==='preview',inquiryMode:live?'live':'simulated',mailProvider:live?'cloudflare':'',origin:mode==='production'?'https://theautovos.com':'https://7c4e9a.demos.beveridge.io',shop:'https://shop.theautovos.com/',turnstileSiteKey:live?'0xFixtureOnly':''};
 for(const page of [...pageData(config),notFound()]){
  const html=render(page,config),footer=html.split('<footer class="av-footer">')[1];
  assert.equal((html.match(/<form id="inquiry"/g)||[]).length,1,page.path);
  assert.equal(footer.includes('<form id="inquiry"'),page.path!=='/get-a-quote/',page.path);
  assert.match(footer,/<iframe class="av-location-map" title="Auto Vos location in Colorado Springs"[^>]*loading="lazy"/);
  assert.equal((html.match(/class="cf-turnstile /g)||[]).length,live?1:0,page.path);
  assert.equal(html.includes('https://challenges.cloudflare.com/turnstile/v0/api.js'),live,page.path);
  for(const id of ['errors','service','name','email','message','consent','send'])assert.equal((html.match(new RegExp(`id="${id}"`,'g'))||[]).length,1,page.path+' '+id);
  assert.match(html,/<input id="consent"[^>]*required/);
  assert.match(html,/<input id="vehicle"[^>]*required/);
  assert.doesNotMatch(html,/<textarea id="message"[^>]*required/);
  assert.match(html,/What would you like help with\? \(optional\)/);
  assert.doesNotMatch(html,/<option value="choose">/);
  assert.match(html,/<option value="general">General inquiry<\/option>/);
  assert.match(html,/class="av-inquiry-panel"/);

  assert.match(html,/<fieldset id="form-fields" disabled/);
  assert.match(html,/<noscript>[\s\S]*mailto:theautovos@gmail.com/);
 }
});
